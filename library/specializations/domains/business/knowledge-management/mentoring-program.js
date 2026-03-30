/**
 * @process domains/business/knowledge-management/mentoring-program
 * @description Design structured mentoring programs that facilitate knowledge transfer between experienced practitioners and learners through guided relationships
 * @specialization Knowledge Management
 * @category Knowledge Sharing and Transfer
 * @inputs { programName: string, organizationalContext: object, targetKnowledgeAreas: array, mentorPool: array, menteePool: array, programDuration: string, outputDir: string }
 * @outputs { success: boolean, programDesign: object, matchingPlan: object, curriculumPath: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programName = '',
    organizationalContext = {},
    targetKnowledgeAreas = [],
    mentorPool = [],
    menteePool = [],
    programDuration = '6 months',
    programGoals = [],
    learningObjectives = [],
    resourceConstraints = {},
    measurementCriteria = [],
    outputDir = 'mentoring-program-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Mentoring Program Design and Implementation Process');

  // ============================================================================
  // PHASE 1: NEEDS ASSESSMENT AND PROGRAM SCOPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing organizational needs and scoping program');
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    programName,
    organizationalContext,
    targetKnowledgeAreas,
    programGoals,
    learningObjectives,
    mentorPool,
    menteePool,
    outputDir
  });

  artifacts.push(...needsAssessment.artifacts);

  if (!needsAssessment.viable) {
    ctx.log('warn', 'Mentoring program not viable with current resources');
    return {
      success: false,
      reason: needsAssessment.viabilityIssues.join('; '),
      recommendations: needsAssessment.recommendations,
      metadata: {
        processId: 'domains/business/knowledge-management/mentoring-program',
        timestamp: startTime
      }
    };
  }

  // Breakpoint: Review needs assessment
  await ctx.breakpoint({
    question: `Needs assessment complete. ${needsAssessment.recommendedProgramType} mentoring program recommended. Review assessment?`,
    title: 'Needs Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        programType: needsAssessment.recommendedProgramType,
        mentorsAvailable: needsAssessment.mentorCapacity,
        menteesToSupport: needsAssessment.menteeCount,
        knowledgeAreas: targetKnowledgeAreas.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: PROGRAM STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing program structure and framework');
  const programStructure = await ctx.task(programStructureTask, {
    programName,
    needsAssessment,
    programDuration,
    organizationalContext,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...programStructure.artifacts);

  // ============================================================================
  // PHASE 3: MENTOR AND MENTEE PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating mentor and mentee profiles');
  const participantProfiles = await ctx.task(participantProfilingTask, {
    programName,
    mentorPool,
    menteePool,
    targetKnowledgeAreas,
    learningObjectives,
    outputDir
  });

  artifacts.push(...participantProfiles.artifacts);

  // ============================================================================
  // PHASE 4: MENTOR-MENTEE MATCHING
  // ============================================================================

  ctx.log('info', 'Phase 4: Matching mentors with mentees');
  const matchingResult = await ctx.task(matchingTask, {
    programName,
    mentorProfiles: participantProfiles.mentorProfiles,
    menteeProfiles: participantProfiles.menteeProfiles,
    targetKnowledgeAreas,
    programStructure: programStructure.structure,
    outputDir
  });

  artifacts.push(...matchingResult.artifacts);

  // Breakpoint: Review matching results
  await ctx.breakpoint({
    question: `${matchingResult.matchCount} mentor-mentee pairs created with ${matchingResult.averageCompatibility}% average compatibility. Review matching?`,
    title: 'Mentor-Mentee Matching Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        matchCount: matchingResult.matchCount,
        averageCompatibility: matchingResult.averageCompatibility,
        unmatchedMentees: matchingResult.unmatchedMentees.length,
        groupMentoringGroups: matchingResult.groupMentoringGroups?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 5: CURRICULUM AND LEARNING PATH DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing curriculum and learning paths');
  const curriculumDesign = await ctx.task(curriculumDesignTask, {
    programName,
    targetKnowledgeAreas,
    learningObjectives,
    programDuration,
    participantProfiles,
    matchingResult,
    outputDir
  });

  artifacts.push(...curriculumDesign.artifacts);

  // ============================================================================
  // PHASE 6: MENTORING ACTIVITIES AND RESOURCES
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing mentoring activities and resources');
  const activitiesDesign = await ctx.task(activitiesDesignTask, {
    programName,
    programStructure: programStructure.structure,
    curriculumDesign,
    targetKnowledgeAreas,
    outputDir
  });

  artifacts.push(...activitiesDesign.artifacts);

  // ============================================================================
  // PHASE 7: MENTOR PREPARATION AND TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing mentor preparation and training');
  const mentorTraining = await ctx.task(mentorTrainingTask, {
    programName,
    mentorProfiles: participantProfiles.mentorProfiles,
    programStructure: programStructure.structure,
    curriculumDesign,
    outputDir
  });

  artifacts.push(...mentorTraining.artifacts);

  // ============================================================================
  // PHASE 8: MENTEE ONBOARDING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing mentee onboarding experience');
  const menteeOnboarding = await ctx.task(menteeOnboardingTask, {
    programName,
    menteeProfiles: participantProfiles.menteeProfiles,
    programStructure: programStructure.structure,
    matchingResult,
    outputDir
  });

  artifacts.push(...menteeOnboarding.artifacts);

  // ============================================================================
  // PHASE 9: PROGRESS TRACKING AND MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing progress tracking and measurement system');
  const measurementSystem = await ctx.task(measurementSystemTask, {
    programName,
    programGoals,
    learningObjectives,
    measurementCriteria,
    programDuration,
    outputDir
  });

  artifacts.push(...measurementSystem.artifacts);

  // ============================================================================
  // PHASE 10: SUPPORT INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 10: Designing support infrastructure');
  const supportInfrastructure = await ctx.task(supportInfrastructureTask, {
    programName,
    programStructure: programStructure.structure,
    organizationalContext,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...supportInfrastructure.artifacts);

  // ============================================================================
  // PHASE 11: PROGRAM DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating comprehensive program documentation');
  const programDocumentation = await ctx.task(programDocumentationTask, {
    programName,
    programStructure: programStructure.structure,
    matchingResult,
    curriculumDesign,
    activitiesDesign,
    mentorTraining,
    menteeOnboarding,
    measurementSystem,
    supportInfrastructure,
    outputDir
  });

  artifacts.push(...programDocumentation.artifacts);

  // ============================================================================
  // PHASE 12: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Assessing program design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    programName,
    programStructure: programStructure.structure,
    matchingResult,
    curriculumDesign,
    measurementSystem,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityMet = qualityAssessment.overallScore >= 80;

  // Breakpoint: Review quality assessment
  await ctx.breakpoint({
    question: `Program design quality score: ${qualityAssessment.overallScore}/100. ${qualityMet ? 'Quality standards met!' : 'May need improvements.'} Review results?`,
    title: 'Quality Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: qualityAssessment.overallScore,
        qualityMet,
        structureScore: qualityAssessment.componentScores.structure,
        matchingScore: qualityAssessment.componentScores.matching,
        issues: qualityAssessment.issues.length
      }
    }
  });

  // ============================================================================
  // PHASE 13: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating implementation plan');
  const implementationPlan = await ctx.task(implementationPlanningTask, {
    programName,
    programStructure: programStructure.structure,
    matchingResult,
    mentorTraining,
    menteeOnboarding,
    supportInfrastructure,
    programDuration,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 14: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 14: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      programName,
      programStructure: programStructure.structure,
      matchingResult,
      qualityScore: qualityAssessment.overallScore,
      implementationPlan,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Proceed with program launch?`,
      title: 'Final Approval Gate',
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
          qualityScore: qualityAssessment.overallScore,
          stakeholdersReviewed: reviewResult.stakeholders.length,
          revisionsNeeded: reviewResult.revisionsNeeded
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    programName,
    programDesign: {
      type: needsAssessment.recommendedProgramType,
      structure: programStructure.structure,
      duration: programDuration,
      phases: programStructure.phases
    },
    matchingPlan: {
      matches: matchingResult.matches,
      matchCount: matchingResult.matchCount,
      averageCompatibility: matchingResult.averageCompatibility,
      groupMentoring: matchingResult.groupMentoringGroups
    },
    curriculumPath: curriculumDesign.learningPaths,
    activities: activitiesDesign.activities,
    qualityScore: qualityAssessment.overallScore,
    statistics: {
      mentorsEnrolled: participantProfiles.mentorProfiles.length,
      menteesEnrolled: participantProfiles.menteeProfiles.length,
      matchesCreated: matchingResult.matchCount,
      learningObjectives: learningObjectives.length,
      activitiesDesigned: activitiesDesign.activities.length,
      milestonesPlanned: measurementSystem.milestones.length
    },
    implementation: {
      readyForLaunch: implementationPlan.readyForLaunch,
      launchDate: implementationPlan.launchDate,
      phases: implementationPlan.phases
    },
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/mentoring-program',
      timestamp: startTime,
      outputDir,
      programDuration
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Needs Assessment
export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess organizational needs for mentoring program',
  agent: {
    name: 'program-analyst',
    prompt: {
      role: 'learning and development analyst specializing in mentoring programs',
      task: 'Assess organizational needs and viability for mentoring program',
      context: args,
      instructions: [
        'Analyze organizational context and culture',
        'Assess knowledge transfer needs and gaps',
        'Evaluate mentor pool capacity and expertise:',
        '  - Expertise areas and depth',
        '  - Availability and commitment',
        '  - Mentoring experience and skills',
        'Evaluate mentee pool characteristics:',
        '  - Learning needs and goals',
        '  - Experience levels',
        '  - Career development objectives',
        'Determine program viability:',
        '  - Resource availability',
        '  - Leadership support',
        '  - Cultural readiness',
        'Recommend program type:',
        '  - One-on-one mentoring',
        '  - Group mentoring',
        '  - Peer mentoring',
        '  - Reverse mentoring',
        '  - Hybrid approaches',
        'Identify potential challenges and risks',
        'Provide recommendations for program success',
        'Save needs assessment to output directory'
      ],
      outputFormat: 'JSON with viable (boolean), viabilityIssues (array), recommendedProgramType (string), mentorCapacity (number), menteeCount (number), knowledgeGaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['viable', 'recommendedProgramType', 'mentorCapacity', 'menteeCount', 'artifacts'],
      properties: {
        viable: { type: 'boolean' },
        viabilityIssues: { type: 'array', items: { type: 'string' } },
        recommendedProgramType: { type: 'string', enum: ['one-on-one', 'group', 'peer', 'reverse', 'hybrid'] },
        mentorCapacity: { type: 'number' },
        menteeCount: { type: 'number' },
        knowledgeGaps: { type: 'array', items: { type: 'string' } },
        culturalFactors: { type: 'array', items: { type: 'string' } },
        challenges: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'needs-assessment']
}));

// Task 2: Program Structure Design
export const programStructureTask = defineTask('program-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design mentoring program structure',
  agent: {
    name: 'program-designer',
    prompt: {
      role: 'mentoring program designer and organizational development specialist',
      task: 'Design comprehensive mentoring program structure and framework',
      context: args,
      instructions: [
        'Design overall program structure:',
        '  - Program phases and timeline',
        '  - Meeting frequency and duration',
        '  - Formal vs informal elements',
        '  - Group vs individual components',
        'Define program phases:',
        '  - Launch and orientation',
        '  - Foundation building',
        '  - Active mentoring',
        '  - Mid-program review',
        '  - Transition and closure',
        'Establish governance model:',
        '  - Program sponsor and oversight',
        '  - Program coordinator role',
        '  - Mentor and mentee responsibilities',
        '  - Escalation and support paths',
        'Define commitment expectations:',
        '  - Time commitment requirements',
        '  - Meeting attendance expectations',
        '  - Communication norms',
        '  - Confidentiality agreements',
        'Create program policies and guidelines',
        'Design flexibility and customization options',
        'Save program structure to output directory'
      ],
      outputFormat: 'JSON with structure (object), phases (array), governance (object), commitments (object), policies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'phases', 'governance', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            duration: { type: 'string' },
            meetingFrequency: { type: 'string' },
            sessionDuration: { type: 'string' },
            formalElements: { type: 'array', items: { type: 'string' } },
            informalElements: { type: 'array', items: { type: 'string' } }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              milestones: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        governance: {
          type: 'object',
          properties: {
            sponsor: { type: 'string' },
            coordinator: { type: 'string' },
            oversight: { type: 'string' },
            escalationPath: { type: 'array', items: { type: 'string' } }
          }
        },
        commitments: {
          type: 'object',
          properties: {
            mentorTime: { type: 'string' },
            menteeTime: { type: 'string' },
            meetingFrequency: { type: 'string' }
          }
        },
        policies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'program-design']
}));

// Task 3: Participant Profiling
export const participantProfilingTask = defineTask('participant-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create mentor and mentee profiles',
  agent: {
    name: 'participant-profiler',
    prompt: {
      role: 'talent assessment specialist',
      task: 'Create detailed profiles for mentors and mentees to enable effective matching',
      context: args,
      instructions: [
        'Create mentor profiles including:',
        '  - Expertise areas and depth',
        '  - Years of experience',
        '  - Mentoring experience and style',
        '  - Availability and capacity',
        '  - Communication preferences',
        '  - Development areas willing to support',
        '  - Personal mentoring philosophy',
        'Create mentee profiles including:',
        '  - Current role and experience level',
        '  - Learning goals and objectives',
        '  - Knowledge gaps and development needs',
        '  - Career aspirations',
        '  - Learning style preferences',
        '  - Availability and commitment',
        '  - Expectations from mentoring',
        'Identify matching criteria and weights',
        'Assess compatibility factors:',
        '  - Expertise alignment',
        '  - Communication style compatibility',
        '  - Schedule compatibility',
        '  - Personality fit considerations',
        'Save participant profiles to output directory'
      ],
      outputFormat: 'JSON with mentorProfiles (array), menteeProfiles (array), matchingCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mentorProfiles', 'menteeProfiles', 'matchingCriteria', 'artifacts'],
      properties: {
        mentorProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              expertise: { type: 'array', items: { type: 'string' } },
              yearsExperience: { type: 'number' },
              mentoringExperience: { type: 'string' },
              availability: { type: 'string' },
              capacity: { type: 'number' },
              communicationStyle: { type: 'string' },
              developmentAreas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        menteeProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              currentRole: { type: 'string' },
              experienceLevel: { type: 'string' },
              learningGoals: { type: 'array', items: { type: 'string' } },
              knowledgeGaps: { type: 'array', items: { type: 'string' } },
              careerAspirations: { type: 'string' },
              learningStyle: { type: 'string' },
              availability: { type: 'string' }
            }
          }
        },
        matchingCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              weight: { type: 'number' },
              description: { type: 'string' }
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
  labels: ['agent', 'mentoring', 'profiling']
}));

// Task 4: Mentor-Mentee Matching
export const matchingTask = defineTask('mentor-mentee-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Match mentors with mentees',
  agent: {
    name: 'matching-specialist',
    prompt: {
      role: 'mentoring program matching specialist',
      task: 'Create optimal mentor-mentee matches based on profiles and criteria',
      context: args,
      instructions: [
        'Apply matching algorithm based on criteria:',
        '  - Expertise alignment with learning goals',
        '  - Communication style compatibility',
        '  - Schedule and availability alignment',
        '  - Experience level appropriateness',
        '  - Development area match',
        'Create primary matches for one-on-one mentoring',
        'Identify group mentoring opportunities where appropriate',
        'Calculate compatibility scores for each match',
        'Handle mentor capacity constraints',
        'Identify unmatched participants and alternatives',
        'Consider backup mentor assignments',
        'Document matching rationale for each pair',
        'Create matching recommendations report',
        'Identify potential conflicts or concerns',
        'Save matching results to output directory'
      ],
      outputFormat: 'JSON with matches (array), matchCount (number), averageCompatibility (number), unmatchedMentees (array), groupMentoringGroups (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matches', 'matchCount', 'averageCompatibility', 'artifacts'],
      properties: {
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mentorId: { type: 'string' },
              mentorName: { type: 'string' },
              menteeId: { type: 'string' },
              menteeName: { type: 'string' },
              compatibilityScore: { type: 'number' },
              matchRationale: { type: 'string' },
              focusAreas: { type: 'array', items: { type: 'string' } },
              potentialChallenges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        matchCount: { type: 'number' },
        averageCompatibility: { type: 'number' },
        unmatchedMentees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              menteeId: { type: 'string' },
              reason: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        groupMentoringGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mentorId: { type: 'string' },
              menteeIds: { type: 'array', items: { type: 'string' } },
              focusArea: { type: 'string' }
            }
          }
        },
        backupAssignments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'matching']
}));

// Task 5: Curriculum Design
export const curriculumDesignTask = defineTask('curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design curriculum and learning paths',
  agent: {
    name: 'curriculum-designer',
    prompt: {
      role: 'learning curriculum designer specializing in mentoring programs',
      task: 'Design comprehensive curriculum and learning paths for mentoring program',
      context: args,
      instructions: [
        'Design learning paths aligned with objectives:',
        '  - Foundational knowledge path',
        '  - Skills development path',
        '  - Career development path',
        '  - Leadership preparation path',
        'Create curriculum modules:',
        '  - Module objectives and outcomes',
        '  - Key topics and content',
        '  - Suggested discussion topics',
        '  - Practical exercises and activities',
        '  - Assessment and reflection points',
        'Sequence learning activities appropriately',
        'Design differentiated paths for different mentee needs',
        'Include just-in-time learning resources',
        'Create milestone checkpoints',
        'Design knowledge transfer activities',
        'Include reflection and application exercises',
        'Save curriculum design to output directory'
      ],
      outputFormat: 'JSON with learningPaths (array), modules (array), milestones (array), resources (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['learningPaths', 'modules', 'milestones', 'artifacts'],
      properties: {
        learningPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              targetAudience: { type: 'string' },
              duration: { type: 'string' },
              modules: { type: 'array', items: { type: 'string' } },
              outcomes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              topics: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              assessments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              timing: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        resources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'curriculum']
}));

// Task 6: Activities Design
export const activitiesDesignTask = defineTask('activities-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design mentoring activities and resources',
  agent: {
    name: 'activities-designer',
    prompt: {
      role: 'learning experience designer',
      task: 'Design engaging mentoring activities and support resources',
      context: args,
      instructions: [
        'Design core mentoring activities:',
        '  - One-on-one session formats and agendas',
        '  - Goal-setting exercises',
        '  - Skill-building activities',
        '  - Knowledge transfer exercises',
        '  - Reflection and feedback sessions',
        'Design supplementary activities:',
        '  - Group learning sessions',
        '  - Peer networking events',
        '  - Job shadowing opportunities',
        '  - Project-based learning',
        '  - Cross-functional exposure',
        'Create activity templates and guides:',
        '  - Session planning templates',
        '  - Discussion guide templates',
        '  - Progress tracking templates',
        '  - Feedback forms',
        'Design virtual and in-person options',
        'Create activity calendar and schedule',
        'Save activities design to output directory'
      ],
      outputFormat: 'JSON with activities (array), templates (array), calendar (object), resources (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'templates', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['one-on-one', 'group', 'self-directed', 'experiential', 'networking'] },
              description: { type: 'string' },
              duration: { type: 'string' },
              frequency: { type: 'string' },
              format: { type: 'string', enum: ['in-person', 'virtual', 'hybrid'] },
              materials: { type: 'array', items: { type: 'string' } },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        calendar: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            keyDates: { type: 'array' }
          }
        },
        resources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'activities']
}));

// Task 7: Mentor Training
export const mentorTrainingTask = defineTask('mentor-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design mentor preparation and training',
  agent: {
    name: 'trainer-designer',
    prompt: {
      role: 'mentor development specialist',
      task: 'Design comprehensive mentor preparation and training program',
      context: args,
      instructions: [
        'Design mentor training curriculum:',
        '  - Mentoring fundamentals and best practices',
        '  - Active listening and questioning skills',
        '  - Feedback and coaching techniques',
        '  - Goal setting and action planning',
        '  - Handling challenging situations',
        '  - Cultural awareness and inclusivity',
        'Create mentor orientation program:',
        '  - Program overview and expectations',
        '  - Roles and responsibilities',
        '  - Tools and resources introduction',
        '  - Matching process explanation',
        'Design ongoing mentor support:',
        '  - Mentor community of practice',
        '  - Peer support and coaching',
        '  - Refresher training sessions',
        '  - Resource library access',
        'Create mentor toolkits and guides',
        'Design mentor certification/recognition',
        'Save mentor training design to output directory'
      ],
      outputFormat: 'JSON with trainingCurriculum (array), orientationProgram (object), ongoingSupport (array), toolkit (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingCurriculum', 'orientationProgram', 'artifacts'],
      properties: {
        trainingCurriculum: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              topics: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              format: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        orientationProgram: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            sessions: { type: 'array' },
            materials: { type: 'array', items: { type: 'string' } }
          }
        },
        ongoingSupport: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              frequency: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        toolkit: { type: 'array', items: { type: 'string' } },
        certification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'mentor-training']
}));

// Task 8: Mentee Onboarding
export const menteeOnboardingTask = defineTask('mentee-onboarding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design mentee onboarding experience',
  agent: {
    name: 'onboarding-designer',
    prompt: {
      role: 'participant experience designer',
      task: 'Design comprehensive mentee onboarding and preparation',
      context: args,
      instructions: [
        'Design mentee orientation program:',
        '  - Program overview and expectations',
        '  - Mentee role and responsibilities',
        '  - How to maximize the mentoring relationship',
        '  - Goal setting and development planning',
        '  - Communication and meeting logistics',
        'Create mentee preparation activities:',
        '  - Self-assessment exercises',
        '  - Goal clarification worksheets',
        '  - Learning style identification',
        '  - Mentor meeting preparation',
        'Design first meeting guidelines:',
        '  - Ice-breaker activities',
        '  - Expectation setting discussion',
        '  - Relationship agreement template',
        '  - Initial goal setting',
        'Create mentee success guides and tips',
        'Design peer support and networking opportunities',
        'Save mentee onboarding design to output directory'
      ],
      outputFormat: 'JSON with orientationProgram (object), preparationActivities (array), firstMeetingGuide (object), successGuides (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['orientationProgram', 'preparationActivities', 'artifacts'],
      properties: {
        orientationProgram: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            sessions: { type: 'array' },
            materials: { type: 'array', items: { type: 'string' } }
          }
        },
        preparationActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              duration: { type: 'string' },
              materials: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        firstMeetingGuide: {
          type: 'object',
          properties: {
            agenda: { type: 'array', items: { type: 'string' } },
            icebreakers: { type: 'array', items: { type: 'string' } },
            discussionTopics: { type: 'array', items: { type: 'string' } },
            templates: { type: 'array', items: { type: 'string' } }
          }
        },
        successGuides: { type: 'array', items: { type: 'string' } },
        peerSupport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'mentee-onboarding']
}));

// Task 9: Measurement System
export const measurementSystemTask = defineTask('measurement-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design progress tracking and measurement system',
  agent: {
    name: 'measurement-designer',
    prompt: {
      role: 'program evaluation and measurement specialist',
      task: 'Design comprehensive measurement system for mentoring program',
      context: args,
      instructions: [
        'Define program success metrics:',
        '  - Participation and engagement metrics',
        '  - Learning outcome metrics',
        '  - Knowledge transfer metrics',
        '  - Satisfaction and experience metrics',
        '  - Business impact metrics',
        'Design measurement instruments:',
        '  - Pre/post assessments',
        '  - Progress check-ins',
        '  - Satisfaction surveys',
        '  - Goal achievement tracking',
        '  - 360-degree feedback',
        'Create milestone checkpoints:',
        '  - 30-day check-in',
        '  - Mid-program review',
        '  - End-of-program evaluation',
        '  - Post-program follow-up',
        'Design reporting and analytics:',
        '  - Program dashboard metrics',
        '  - Individual progress reports',
        '  - Aggregate program reports',
        'Create early warning indicators',
        'Design continuous improvement feedback loops',
        'Save measurement system to output directory'
      ],
      outputFormat: 'JSON with metrics (array), instruments (array), milestones (array), reporting (object), earlyWarningIndicators (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'instruments', 'milestones', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['participation', 'learning', 'transfer', 'satisfaction', 'impact'] },
              description: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        instruments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              timing: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reporting: {
          type: 'object',
          properties: {
            dashboardMetrics: { type: 'array', items: { type: 'string' } },
            reportingCadence: { type: 'string' },
            audiences: { type: 'array', items: { type: 'string' } }
          }
        },
        earlyWarningIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'measurement']
}));

// Task 10: Support Infrastructure
export const supportInfrastructureTask = defineTask('support-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design support infrastructure',
  agent: {
    name: 'infrastructure-designer',
    prompt: {
      role: 'program operations specialist',
      task: 'Design support infrastructure for mentoring program',
      context: args,
      instructions: [
        'Design technology and tools:',
        '  - Mentoring platform or software',
        '  - Communication tools',
        '  - Document sharing and collaboration',
        '  - Progress tracking systems',
        '  - Calendar and scheduling tools',
        'Design program administration:',
        '  - Coordinator responsibilities',
        '  - Administrative workflows',
        '  - Issue resolution processes',
        '  - Participant support channels',
        'Create communication infrastructure:',
        '  - Program communications calendar',
        '  - Newsletter and updates',
        '  - Community forums or channels',
        '  - FAQ and self-service resources',
        'Design escalation and support processes:',
        '  - Relationship challenges handling',
        '  - Re-matching procedures',
        '  - Conflict resolution process',
        'Create resource library and knowledge base',
        'Save support infrastructure to output directory'
      ],
      outputFormat: 'JSON with technology (object), administration (object), communication (object), escalation (object), resources (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['technology', 'administration', 'communication', 'artifacts'],
      properties: {
        technology: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } }
          }
        },
        administration: {
          type: 'object',
          properties: {
            roles: { type: 'array' },
            workflows: { type: 'array' },
            policies: { type: 'array', items: { type: 'string' } }
          }
        },
        communication: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            calendar: { type: 'array' },
            templates: { type: 'array', items: { type: 'string' } }
          }
        },
        escalation: {
          type: 'object',
          properties: {
            process: { type: 'array', items: { type: 'string' } },
            contacts: { type: 'array' },
            rematchingProcess: { type: 'string' }
          }
        },
        resources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'infrastructure']
}));

// Task 11: Program Documentation
export const programDocumentationTask = defineTask('program-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive program documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'program documentation specialist',
      task: 'Create comprehensive documentation for the mentoring program',
      context: args,
      instructions: [
        'Create program overview document:',
        '  - Program purpose and objectives',
        '  - Program structure and timeline',
        '  - Roles and responsibilities',
        '  - Key policies and guidelines',
        'Create participant guides:',
        '  - Mentor handbook',
        '  - Mentee handbook',
        '  - Quick reference guides',
        'Create operational documentation:',
        '  - Administrator guide',
        '  - Process workflows',
        '  - Templates and forms',
        '  - FAQ documents',
        'Create communication materials:',
        '  - Program announcement templates',
        '  - Email templates',
        '  - Presentation slides',
        'Compile all resources into program package',
        'Save program documentation to output directory'
      ],
      outputFormat: 'JSON with programOverview (string), mentorHandbook (string), menteeHandbook (string), adminGuide (string), templates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['programOverview', 'mentorHandbook', 'menteeHandbook', 'artifacts'],
      properties: {
        programOverview: { type: 'string' },
        mentorHandbook: { type: 'string' },
        menteeHandbook: { type: 'string' },
        adminGuide: { type: 'string' },
        quickReferenceGuides: { type: 'array', items: { type: 'string' } },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        communicationMaterials: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'documentation']
}));

// Task 12: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess program design quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'program quality assessor',
      task: 'Evaluate the quality and completeness of the mentoring program design',
      context: args,
      instructions: [
        'Evaluate program structure (25%):',
        '  - Clarity of program design',
        '  - Appropriate duration and pacing',
        '  - Balance of activities',
        '  - Governance clarity',
        'Evaluate matching quality (25%):',
        '  - Matching criteria appropriateness',
        '  - Compatibility scores',
        '  - Coverage of participants',
        '  - Backup plans',
        'Evaluate curriculum quality (25%):',
        '  - Learning objectives clarity',
        '  - Content relevance',
        '  - Activity variety',
        '  - Assessment methods',
        'Evaluate measurement system (25%):',
        '  - Metric coverage',
        '  - Measurement practicality',
        '  - Reporting adequacy',
        'Calculate weighted overall score (0-100)',
        'Identify areas for improvement',
        'Provide specific recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), issues (array), strengths (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            structure: { type: 'number' },
            matching: { type: 'number' },
            curriculum: { type: 'number' },
            measurement: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'quality-assessment']
}));

// Task 13: Implementation Planning
export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'program implementation specialist',
      task: 'Create detailed implementation plan for mentoring program launch',
      context: args,
      instructions: [
        'Create implementation timeline:',
        '  - Pre-launch preparation phase',
        '  - Launch and kickoff phase',
        '  - Active program phase',
        '  - Closure and evaluation phase',
        'Define launch checklist:',
        '  - Technology setup',
        '  - Materials preparation',
        '  - Participant communication',
        '  - Training delivery',
        '  - Matching finalization',
        'Plan launch activities:',
        '  - Kickoff event design',
        '  - Initial communications',
        '  - First week activities',
        'Identify dependencies and risks',
        'Define go/no-go criteria',
        'Create contingency plans',
        'Assign implementation responsibilities',
        'Save implementation plan to output directory'
      ],
      outputFormat: 'JSON with readyForLaunch (boolean), launchDate (string), phases (array), launchChecklist (array), risks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readyForLaunch', 'phases', 'launchChecklist', 'artifacts'],
      properties: {
        readyForLaunch: { type: 'boolean' },
        launchDate: { type: 'string' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              milestones: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        launchChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string', enum: ['complete', 'in-progress', 'not-started'] },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        goNoGoCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'implementation']
}));

// Task 14: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of mentoring program',
      context: args,
      instructions: [
        'Present program design to stakeholders:',
        '  - Program structure and timeline',
        '  - Matching results and approach',
        '  - Curriculum and activities',
        '  - Measurement and success criteria',
        '  - Implementation plan',
        'Gather feedback from key stakeholders:',
        '  - Executive sponsors',
        '  - HR and L&D leadership',
        '  - Potential participants',
        '  - Line managers',
        'Validate program meets organizational needs',
        'Review resource requirements',
        'Identify concerns and objections',
        'Determine if revisions are needed',
        'Document approval or required changes',
        'Create action plan for feedback',
        'Save stakeholder review to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), revisionsNeeded (boolean), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              category: { type: 'string' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mentoring', 'stakeholder-review', 'approval']
}));
