/**
 * @process methodologies/jobs-to-be-done
 * @description Jobs to Be Done (JTBD) - Customer progress-focused product strategy and requirements discovery
 * @inputs { projectName: string, context?: string, researchData?: string, phase?: string }
 * @outputs { success: boolean, jobs: object, forces: object, jobStories: object, solutions: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Jobs to Be Done Process
 *
 * Clayton Christensen's JTBD Framework: Focus on the progress customers are trying to make
 * in their lives rather than on products or user personas. "People don't want a quarter-inch drill,
 * they want a quarter-inch hole."
 *
 * Four-Phase JTBD Cycle:
 * 1. Job Discovery - Identify customer jobs through interviews and observation
 * 2. Forces Analysis - Analyze push/pull forces, anxiety, and habits
 * 3. Job Stories - Convert jobs to "When [situation], I want to [motivation], so I can [outcome]"
 * 4. Solution Mapping - Map features to jobs and define success criteria
 *
 * Supports: Progress-focused requirements, switching triggers, forces diagram, job stories
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the product/project
 * @param {string} inputs.context - Business context and current situation
 * @param {string} inputs.researchData - Customer research data (interviews, surveys, feedback)
 * @param {string} inputs.phase - Starting phase: discovery|forces|stories|full (default: full)
 * @param {string} inputs.existingJobs - Path to existing job analysis (for refinement)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with jobs, forces, job stories, and solution mapping
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    context = '',
    researchData = '',
    phase = 'full',
    existingJobs = null
  } = inputs;

  const results = {
    projectName,
    jobs: null,
    forces: null,
    jobStories: null,
    solutions: null
  };

  // ============================================================================
  // PHASE 1: JOB DISCOVERY
  // ============================================================================

  if (phase === 'discovery' || phase === 'full') {
    // Step 1.1: Discover Customer Jobs
    const jobDiscoveryResult = await ctx.task(jobDiscoveryTask, {
      projectName,
      context,
      researchData,
      existingJobs
    });

    results.jobs = jobDiscoveryResult;

    // Breakpoint: Review discovered jobs
    await ctx.breakpoint({
      question: `Review discovered jobs for "${projectName}". ${jobDiscoveryResult.mainJobs?.length || 0} main jobs and ${jobDiscoveryResult.relatedJobs?.length || 0} related jobs identified. Focus on progress customers want to make, not product features. Approve to continue with forces analysis?`,
      title: 'Job Discovery Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/jtbd/JOBS.md', format: 'markdown', label: 'Discovered Jobs' },
          { path: 'artifacts/jtbd/job-clusters.json', format: 'code', language: 'json', label: 'Job Clusters' },
          { path: 'artifacts/jtbd/struggles.md', format: 'markdown', label: 'Customer Struggles' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 2: FORCES ANALYSIS
  // ============================================================================

  if (phase === 'forces' || phase === 'full') {
    // If starting from forces phase, load existing jobs
    if (phase === 'forces' && existingJobs) {
      const loadedJobs = await ctx.task(loadJobsTask, {
        existingJobs
      });
      results.jobs = loadedJobs;
    }

    const mainJobs = results.jobs?.mainJobs || [];

    // Analyze forces for each main job in parallel
    const forcesResults = await ctx.parallel.all(
      mainJobs.map(job => async () => {
        return await ctx.task(forcesAnalysisTask, {
          projectName,
          job,
          context,
          researchData
        });
      })
    );

    results.forces = {
      jobForces: forcesResults
    };

    // Breakpoint: Review forces analysis
    await ctx.breakpoint({
      question: `Review forces analysis for "${projectName}". Forces diagrams created for ${mainJobs.length} main job(s). Push forces (current problems), Pull forces (new solution appeal), Anxiety (concerns), and Habits (comfort with current) identified. Approve to proceed with job stories?`,
      title: 'Forces Analysis Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/jtbd/FORCES.md', format: 'markdown', label: 'Forces Analysis' },
          { path: 'artifacts/jtbd/forces-diagram.json', format: 'code', language: 'json', label: 'Forces Diagrams' },
          { path: 'artifacts/jtbd/switching-triggers.md', format: 'markdown', label: 'Switching Triggers' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 3: JOB STORY GENERATION
  // ============================================================================

  if (phase === 'stories' || phase === 'full') {
    // If starting from stories phase, load existing data
    if (phase === 'stories' && existingJobs) {
      const loadedData = await ctx.task(loadJobsTask, {
        existingJobs
      });
      results.jobs = loadedData.jobs;
      results.forces = loadedData.forces;
    }

    const mainJobs = results.jobs?.mainJobs || [];

    // Generate job stories for each job in parallel
    const jobStoriesResults = await ctx.parallel.all(
      mainJobs.map(job => async () => {
        const jobForces = results.forces?.jobForces?.find(
          jf => jf.jobName === job.name
        );

        return await ctx.task(jobStoryGenerationTask, {
          projectName,
          job,
          forces: jobForces,
          context
        });
      })
    );

    results.jobStories = {
      stories: jobStoriesResults.flat()
    };

    // Breakpoint: Review job stories
    await ctx.breakpoint({
      question: `Review job stories for "${projectName}". ${results.jobStories.stories.length} job stories generated in format "When [situation], I want to [motivation], so I can [outcome]". Stories focus on causality and context, not personas. Approve to proceed with solution mapping?`,
      title: 'Job Stories Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/jtbd/JOB_STORIES.md', format: 'markdown', label: 'Job Stories' },
          { path: 'artifacts/jtbd/job-stories.json', format: 'code', language: 'json', label: 'Job Stories Data' },
          { path: 'artifacts/jtbd/stories-by-job.md', format: 'markdown', label: 'Stories Organized by Job' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: SOLUTION MAPPING
  // ============================================================================

  if (phase === 'full') {
    // Step 4.1: Map Solutions to Jobs
    const solutionMappingResult = await ctx.task(solutionMappingTask, {
      projectName,
      jobs: results.jobs,
      forces: results.forces,
      jobStories: results.jobStories,
      context
    });

    results.solutions = solutionMappingResult;

    // Breakpoint: Review solution mapping
    await ctx.breakpoint({
      question: `Review solution mapping for "${projectName}". Features mapped to jobs with progress measurements and success criteria. ${solutionMappingResult.featureJobMap?.length || 0} feature-to-job mappings defined. Approve to proceed with final validation?`,
      title: 'Solution Mapping Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/jtbd/SOLUTION_MAP.md', format: 'markdown', label: 'Solution Mapping' },
          { path: 'artifacts/jtbd/feature-job-map.json', format: 'code', language: 'json', label: 'Feature-Job Mapping' },
          { path: 'artifacts/jtbd/success-metrics.md', format: 'markdown', label: 'Success Metrics' }
        ]
      }
    });
  }

  // ============================================================================
  // FINAL VALIDATION
  // ============================================================================

  // Validate complete JTBD analysis
  const finalValidation = await ctx.task(validateJTBDTask, {
    projectName,
    jobs: results.jobs,
    forces: results.forces,
    jobStories: results.jobStories,
    solutions: results.solutions,
    phase
  });

  // Final breakpoint
  await ctx.breakpoint({
    question: `Jobs to Be Done analysis complete for "${projectName}". Validation: ${finalValidation.valid}. JTBD framework helps understand customer progress and build solutions that help them make that progress. Review complete analysis and approve?`,
    title: 'JTBD Analysis Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/jtbd/JTBD_SUMMARY.md', format: 'markdown', label: 'JTBD Summary' },
        { path: 'artifacts/jtbd/JOBS.md', format: 'markdown', label: 'Customer Jobs' },
        { path: 'artifacts/jtbd/FORCES.md', format: 'markdown', label: 'Forces Analysis' },
        { path: 'artifacts/jtbd/JOB_STORIES.md', format: 'markdown', label: 'Job Stories' },
        { path: 'artifacts/jtbd/SOLUTION_MAP.md', format: 'markdown', label: 'Solution Mapping' }
      ]
    }
  });

  return {
    success: finalValidation.valid,
    projectName,
    phase,
    jobs: results.jobs,
    forces: results.forces,
    jobStories: results.jobStories,
    solutions: results.solutions,
    validation: finalValidation,
    artifacts: {
      summary: 'artifacts/jtbd/JTBD_SUMMARY.md',
      jobs: 'artifacts/jtbd/JOBS.md',
      forces: 'artifacts/jtbd/FORCES.md',
      jobStories: 'artifacts/jtbd/JOB_STORIES.md',
      solutionMap: 'artifacts/jtbd/SOLUTION_MAP.md',
      featureJobMap: 'artifacts/jtbd/feature-job-map.json'
    },
    metadata: {
      processId: 'methodologies/jobs-to-be-done',
      timestamp: ctx.now(),
      methodology: 'Jobs to Be Done (Clayton Christensen)',
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Job Discovery
 * Discover customer jobs through interview analysis and observation
 */
export const jobDiscoveryTask = defineTask('job-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discover customer jobs: ${args.projectName}`,
  description: 'Identify customer jobs focusing on progress they want to make',

  agent: {
    name: 'jtbd-job-researcher',
    prompt: {
      role: 'JTBD researcher and customer job analyst',
      task: 'Discover and analyze customer jobs',
      context: {
        projectName: args.projectName,
        context: args.context,
        researchData: args.researchData,
        existingJobs: args.existingJobs
      },
      instructions: [
        'Analyze customer research data to identify jobs customers are trying to get done',
        'Focus on the progress customers want to make in their lives, not product features',
        'Jobs are the fundamental goals customers are trying to achieve',
        'Look for struggles, workarounds, and switching triggers in customer feedback',
        'Identify main jobs (primary progress) and related jobs (secondary progress)',
        'Ask "What job did you hire this product to do?"',
        'Consider functional, emotional, and social dimensions of jobs',
        'Cluster similar jobs together',
        'Document the circumstances and context in which jobs arise',
        'Avoid describing solutions - focus on the underlying need for progress'
      ],
      outputFormat: 'JSON with main jobs, related jobs, struggles, and job clusters'
    },
    outputSchema: {
      type: 'object',
      required: ['mainJobs', 'relatedJobs', 'struggles'],
      properties: {
        mainJobs: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'description', 'progressDefinition'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              progressDefinition: { type: 'string' },
              functionalDimension: { type: 'string' },
              emotionalDimension: { type: 'string' },
              socialDimension: { type: 'string' },
              circumstances: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string', enum: ['frequent', 'periodic', 'rare'] },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        relatedJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              relatedToMainJob: { type: 'string' }
            }
          }
        },
        struggles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              struggle: { type: 'string' },
              jobRelated: { type: 'string' },
              currentWorkaround: { type: 'string' }
            }
          }
        },
        jobClusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clusterName: { type: 'string' },
              jobs: { type: 'array', items: { type: 'string' } },
              theme: { type: 'string' }
            }
          }
        },
        switchingTriggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              description: { type: 'string' },
              jobRelated: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'jtbd', 'job-discovery', 'research']
}));

/**
 * Task: Forces Analysis
 * Analyze forces affecting job completion using the forces diagram
 */
export const forcesAnalysisTask = defineTask('forces-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze forces: ${args.job.name}`,
  description: 'Analyze push/pull forces, anxiety, and habits for job',

  agent: {
    name: 'jtbd-forces-analyst',
    prompt: {
      role: 'JTBD forces diagram analyst',
      task: 'Analyze forces affecting job completion',
      context: {
        projectName: args.projectName,
        job: args.job,
        context: args.context,
        researchData: args.researchData
      },
      instructions: [
        'Create forces diagram for the job',
        'Push forces: What problems push customers away from current solution?',
        'Pull forces: What attracts customers to new solution?',
        'Anxiety forces: What concerns do customers have about new solution?',
        'Habits forces: What comfort/familiarity keeps them with current solution?',
        'Push and Pull forces favor switching to new solution',
        'Anxiety and Habits forces resist switching',
        'Identify which forces are strongest',
        'Document specific examples from customer research',
        'Consider timing - when do forces become strong enough to trigger switching?'
      ],
      outputFormat: 'JSON with push, pull, anxiety, and habit forces'
    },
    outputSchema: {
      type: 'object',
      required: ['jobName', 'pushForces', 'pullForces', 'anxietyForces', 'habitForces'],
      properties: {
        jobName: { type: 'string' },
        pushForces: {
          type: 'array',
          items: {
            type: 'object',
            required: ['force', 'strength', 'description'],
            properties: {
              force: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pullForces: {
          type: 'array',
          items: {
            type: 'object',
            required: ['force', 'strength', 'description'],
            properties: {
              force: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              description: { type: 'string' },
              appeal: { type: 'string' }
            }
          }
        },
        anxietyForces: {
          type: 'array',
          items: {
            type: 'object',
            required: ['anxiety', 'strength', 'description'],
            properties: {
              anxiety: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              description: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        habitForces: {
          type: 'array',
          items: {
            type: 'object',
            required: ['habit', 'strength', 'description'],
            properties: {
              habit: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              description: { type: 'string' },
              overcome: { type: 'string' }
            }
          }
        },
        forceBalance: {
          type: 'object',
          properties: {
            switchingLikelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
            criticalForces: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'jtbd', 'forces-analysis', args.job.name]
}));

/**
 * Task: Job Story Generation
 * Convert jobs to job stories format
 */
export const jobStoryGenerationTask = defineTask('job-story-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate job stories: ${args.job.name}`,
  description: 'Convert job to job stories format with context and motivation',

  agent: {
    name: 'jtbd-story-writer',
    prompt: {
      role: 'JTBD job story writer',
      task: 'Generate job stories for job',
      context: {
        projectName: args.projectName,
        job: args.job,
        forces: args.forces,
        context: args.context
      },
      instructions: [
        'Write job stories in format: "When [situation], I want to [motivation], so I can [outcome]"',
        'When: Describe the situation/context that triggers the job',
        'I want to: Describe the motivation/what they want to do',
        'So I can: Describe the desired outcome/progress',
        'Focus on causality and context, not personas or demographics',
        'Avoid implementation details - stay at the problem level',
        'Use specific, concrete language from customer research',
        'Create multiple stories for different situations that trigger the same job',
        'Consider stories for overcoming each anxiety force',
        'Stories should be implementation-agnostic',
        'Good: "When I\'m preparing for a client meeting, I want to quickly find relevant case studies, so I can build credibility"',
        'Bad: "As a sales rep, I want a search feature with filters"'
      ],
      outputFormat: 'JSON with job stories'
    },
    outputSchema: {
      type: 'object',
      required: ['jobName', 'stories'],
      properties: {
        jobName: { type: 'string' },
        stories: {
          type: 'array',
          items: {
            type: 'object',
            required: ['when', 'iWantTo', 'soICan'],
            properties: {
              when: { type: 'string' },
              iWantTo: { type: 'string' },
              soICan: { type: 'string' },
              fullStory: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              relatedForce: { type: 'string' },
              context: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'jtbd', 'job-stories', args.job.name]
}));

/**
 * Task: Solution Mapping
 * Map features to jobs and define success criteria
 */
export const solutionMappingTask = defineTask('solution-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Map solutions to jobs: ${args.projectName}`,
  description: 'Map features to jobs and define progress measurements',

  agent: {
    name: 'jtbd-solution-mapper',
    prompt: {
      role: 'JTBD solution architect and product strategist',
      task: 'Map solutions to jobs and define success criteria',
      context: {
        projectName: args.projectName,
        jobs: args.jobs,
        forces: args.forces,
        jobStories: args.jobStories,
        context: args.context
      },
      instructions: [
        'Map potential features/solutions to specific jobs',
        'Prioritize features that help customers make progress on main jobs',
        'Features should address push forces and pull forces',
        'Features should reduce anxiety forces',
        'Features should help overcome habit forces',
        'Define how to measure progress for each job',
        'Define success criteria: What does "job well done" look like?',
        'Consider minimum viable solution to validate job importance',
        'Avoid feature bloat - focus on job completion',
        'Document feature-to-job mapping clearly',
        'Identify jobs that are underserved by current solutions'
      ],
      outputFormat: 'JSON with feature-to-job mapping and success metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['featureJobMap', 'progressMeasurements', 'successCriteria'],
      properties: {
        featureJobMap: {
          type: 'array',
          items: {
            type: 'object',
            required: ['feature', 'jobsAddressed', 'forcesAddressed', 'priority'],
            properties: {
              feature: { type: 'string' },
              description: { type: 'string' },
              jobsAddressed: { type: 'array', items: { type: 'string' } },
              forcesAddressed: {
                type: 'object',
                properties: {
                  pushForces: { type: 'array', items: { type: 'string' } },
                  pullForces: { type: 'array', items: { type: 'string' } },
                  anxietyReduction: { type: 'array', items: { type: 'string' } },
                  habitOvercome: { type: 'array', items: { type: 'string' } }
                }
              },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              rationale: { type: 'string' },
              mvpCandidate: { type: 'boolean' }
            }
          }
        },
        progressMeasurements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobName: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              leadingIndicators: { type: 'array', items: { type: 'string' } },
              laggingIndicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobName: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              jobWellDone: { type: 'string' }
            }
          }
        },
        underservedJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobName: { type: 'string' },
              gap: { type: 'string' },
              opportunity: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'jtbd', 'solution-mapping', 'product-strategy']
}));

/**
 * Task: Validate JTBD Analysis
 * Validate complete JTBD analysis for consistency and completeness
 */
export const validateJTBDTask = defineTask('validate-jtbd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate JTBD analysis: ${args.projectName}`,
  description: 'Validate JTBD analysis for consistency and completeness',

  agent: {
    name: 'jtbd-validator',
    prompt: {
      role: 'JTBD methodology validator and quality assurance',
      task: 'Validate complete JTBD analysis',
      context: {
        projectName: args.projectName,
        jobs: args.jobs,
        forces: args.forces,
        jobStories: args.jobStories,
        solutions: args.solutions,
        phase: args.phase
      },
      instructions: [
        'Validate that jobs focus on progress, not product features',
        'Check that forces analysis is complete (push, pull, anxiety, habits)',
        'Verify job stories follow correct format and avoid implementation details',
        'Validate that solution mapping connects features to jobs',
        'Check that success criteria are measurable',
        'Verify that main jobs are well-supported by features',
        'Identify gaps or inconsistencies',
        'Ensure focus on customer progress throughout',
        'Validate that anxiety forces have mitigation strategies',
        'Check that job stories are implementation-agnostic'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'completeness', 'issues', 'recommendations'],
      properties: {
        valid: { type: 'boolean' },
        completeness: {
          type: 'object',
          properties: {
            jobDiscovery: { type: 'number' },
            forcesAnalysis: { type: 'number' },
            jobStories: { type: 'number' },
            solutionMapping: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              category: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              area: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'jtbd', 'validation']
}));

/**
 * Task: Load Jobs
 * Load existing jobs analysis for refinement
 */
export const loadJobsTask = defineTask('load-jobs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load existing jobs analysis',
  description: 'Load and parse existing JTBD artifacts',

  agent: {
    name: 'jtbd-loader',
    prompt: {
      role: 'JTBD artifact loader',
      task: 'Load and parse existing JTBD analysis',
      context: {
        existingJobs: args.existingJobs
      },
      instructions: [
        'Load existing job discovery artifacts',
        'Load existing forces analysis if available',
        'Parse and validate artifact structure',
        'Return loaded data for refinement'
      ],
      outputFormat: 'JSON with loaded jobs and forces data'
    },
    outputSchema: {
      type: 'object',
      properties: {
        jobs: { type: 'object' },
        forces: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'jtbd', 'load-data']
}));
