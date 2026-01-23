/**
 * @process product-management/moscow-prioritization
 * @description MoSCoW prioritization framework implementation for product requirements with stakeholder engagement, Must/Should/Could/Won't categorization, validation workshops, release scope definition, and MVP specification
 * @inputs { requirements: array, stakeholders: array, timeframe: string, constraints: object, outputDir: string, businessGoals: array }
 * @outputs { success: boolean, prioritizedRequirements: object, mvpScope: object, releaseScope: array, stakeholderAlignment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    requirements = [],
    stakeholders = [],
    timeframe = '3 months',
    constraints = {},
    outputDir = 'moscow-prioritization-output',
    businessGoals = [],
    includeValidationWorkshop = true,
    generateRoadmap = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting MoSCoW Prioritization Process');

  // ============================================================================
  // PHASE 1: REQUIREMENTS GATHERING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering and preparing requirements');
  const requirementsPrep = await ctx.task(requirementsGatheringTask, {
    requirements,
    stakeholders,
    businessGoals,
    constraints,
    outputDir
  });

  artifacts.push(...requirementsPrep.artifacts);

  if (requirementsPrep.requirements.length === 0) {
    ctx.log('warn', 'No requirements to prioritize');
    return {
      success: false,
      reason: 'No requirements provided or gathered',
      artifacts,
      metadata: {
        processId: 'product-management/moscow-prioritization',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: INITIAL MOSCOW CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing initial MoSCoW categorization');
  const initialCategorization = await ctx.task(moscowCategorizationTask, {
    requirements: requirementsPrep.requirements,
    businessGoals,
    timeframe,
    constraints,
    outputDir
  });

  artifacts.push(...initialCategorization.artifacts);

  // Breakpoint: Review initial categorization
  await ctx.breakpoint({
    question: `Initial MoSCoW categorization complete. Must-have: ${initialCategorization.categorization.must.length}, Should-have: ${initialCategorization.categorization.should.length}, Could-have: ${initialCategorization.categorization.could.length}, Won't-have: ${initialCategorization.categorization.wont.length}. Review categorization?`,
    title: 'Initial MoSCoW Categorization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalRequirements: requirementsPrep.requirements.length,
        mustHave: initialCategorization.categorization.must.length,
        shouldHave: initialCategorization.categorization.should.length,
        couldHave: initialCategorization.categorization.could.length,
        wontHave: initialCategorization.categorization.wont.length,
        categorizedPercentage: initialCategorization.coveragePercentage
      }
    }
  });

  // ============================================================================
  // PHASE 3: STAKEHOLDER ALIGNMENT AND VALIDATION
  // ============================================================================

  let validatedCategorization = initialCategorization;
  let validationResult = null;

  if (includeValidationWorkshop) {
    ctx.log('info', 'Phase 3: Conducting stakeholder validation workshop');
    validationResult = await ctx.task(stakeholderValidationTask, {
      categorization: initialCategorization.categorization,
      stakeholders,
      businessGoals,
      timeframe,
      constraints,
      outputDir
    });

    artifacts.push(...validationResult.artifacts);

    // Breakpoint: Stakeholder feedback review
    await ctx.breakpoint({
      question: `Stakeholder validation complete. Alignment score: ${validationResult.alignmentScore}/100. ${validationResult.changesRequested.length} change(s) requested. Review feedback and proceed with refinement?`,
      title: 'Stakeholder Validation Review',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          alignmentScore: validationResult.alignmentScore,
          stakeholdersParticipated: validationResult.participatingStakeholders.length,
          changesRequested: validationResult.changesRequested.length,
          conflicts: validationResult.conflicts.length,
          consensus: validationResult.consensusAchieved
        }
      }
    });

    // ============================================================================
    // PHASE 4: REFINEMENT BASED ON FEEDBACK
    // ============================================================================

    if (validationResult.changesRequested.length > 0) {
      ctx.log('info', 'Phase 4: Refining categorization based on stakeholder feedback');
      const refinement = await ctx.task(categorizationRefinementTask, {
        categorization: initialCategorization.categorization,
        feedback: validationResult.changesRequested,
        conflicts: validationResult.conflicts,
        stakeholders,
        outputDir
      });

      validatedCategorization = refinement;
      artifacts.push(...refinement.artifacts);
    }
  }

  // ============================================================================
  // PHASE 5: DEPENDENCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing requirement dependencies');
  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    categorization: validatedCategorization.categorization || validatedCategorization,
    requirements: requirementsPrep.requirements,
    outputDir
  });

  artifacts.push(...dependencyAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: EFFORT AND VALUE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Estimating effort and business value');
  const estimationAnalysis = await ctx.task(effortValueEstimationTask, {
    categorization: validatedCategorization.categorization || validatedCategorization,
    dependencies: dependencyAnalysis.dependencies,
    timeframe,
    constraints,
    outputDir
  });

  artifacts.push(...estimationAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: RELEASE SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining release scope');
  const releaseScope = await ctx.task(releaseScopeDefinitionTask, {
    categorization: validatedCategorization.categorization || validatedCategorization,
    estimates: estimationAnalysis.estimates,
    dependencies: dependencyAnalysis.dependencies,
    timeframe,
    constraints,
    outputDir
  });

  artifacts.push(...releaseScope.artifacts);

  // ============================================================================
  // PHASE 8: MVP SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Specifying Minimum Viable Product (MVP)');
  const mvpSpecification = await ctx.task(mvpSpecificationTask, {
    mustHaveRequirements: validatedCategorization.categorization?.must || validatedCategorization.must,
    dependencies: dependencyAnalysis.dependencies,
    estimates: estimationAnalysis.estimates,
    businessGoals,
    timeframe,
    outputDir
  });

  artifacts.push(...mvpSpecification.artifacts);

  // Breakpoint: Final review of prioritization and MVP
  await ctx.breakpoint({
    question: `MoSCoW prioritization complete. MVP contains ${mvpSpecification.mvpScope.features.length} features with estimated ${mvpSpecification.mvpScope.totalEffort}. Release scope defined for ${releaseScope.releases.length} release(s). Review final prioritization?`,
    title: 'Final Prioritization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        mvpFeatures: mvpSpecification.mvpScope.features.length,
        mvpEffort: mvpSpecification.mvpScope.totalEffort,
        mvpValue: mvpSpecification.mvpScope.businessValue,
        releases: releaseScope.releases.length,
        totalMustHave: validatedCategorization.categorization?.must.length || validatedCategorization.must?.length || 0,
        totalShouldHave: validatedCategorization.categorization?.should.length || validatedCategorization.should?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 9: ROADMAP GENERATION (OPTIONAL)
  // ============================================================================

  let roadmap = null;
  if (generateRoadmap) {
    ctx.log('info', 'Phase 9: Generating product roadmap');
    roadmap = await ctx.task(roadmapGenerationTask, {
      releases: releaseScope.releases,
      mvp: mvpSpecification.mvpScope,
      categorization: validatedCategorization.categorization || validatedCategorization,
      timeframe,
      outputDir
    });

    artifacts.push(...roadmap.artifacts);
  }

  // ============================================================================
  // PHASE 10: DOCUMENTATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating final documentation and reports');
  const documentation = await ctx.task(documentationGenerationTask, {
    categorization: validatedCategorization.categorization || validatedCategorization,
    mvp: mvpSpecification.mvpScope,
    releases: releaseScope.releases,
    roadmap: roadmap ? roadmap.roadmap : null,
    stakeholders,
    validationResult,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    prioritizedRequirements: {
      must: validatedCategorization.categorization?.must || validatedCategorization.must,
      should: validatedCategorization.categorization?.should || validatedCategorization.should,
      could: validatedCategorization.categorization?.could || validatedCategorization.could,
      wont: validatedCategorization.categorization?.wont || validatedCategorization.wont
    },
    mvpScope: mvpSpecification.mvpScope,
    releaseScope: releaseScope.releases,
    stakeholderAlignment: {
      score: validationResult ? validationResult.alignmentScore : 100,
      consensus: validationResult ? validationResult.consensusAchieved : true,
      conflicts: validationResult ? validationResult.conflicts : []
    },
    dependencies: dependencyAnalysis.dependencySummary,
    estimates: {
      totalEffort: estimationAnalysis.totalEffort,
      totalValue: estimationAnalysis.totalValue,
      roi: estimationAnalysis.roi
    },
    roadmap: roadmap ? roadmap.roadmap : null,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/moscow-prioritization',
      timestamp: startTime,
      outputDir,
      timeframe,
      requirementsProcessed: requirementsPrep.requirements.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements Gathering and Preparation
export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather and prepare requirements for prioritization',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'senior product manager and requirements analyst',
      task: 'Gather, structure, and prepare requirements for MoSCoW prioritization',
      context: args,
      instructions: [
        'Review provided requirements list',
        'For each requirement, ensure it has:',
        '  - Clear ID or identifier',
        '  - Descriptive title',
        '  - Detailed description',
        '  - Acceptance criteria (if available)',
        '  - Rationale/business value',
        'Identify any missing requirements by analyzing:',
        '  - Business goals alignment',
        '  - Stakeholder needs',
        '  - Technical constraints',
        '  - Regulatory/compliance needs',
        'Group related requirements into epics or themes',
        'Ensure requirements are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)',
        'Flag any ambiguous or unclear requirements for clarification',
        'Document assumptions and dependencies',
        'Create structured requirements catalog',
        'Save requirements catalog to output directory'
      ],
      outputFormat: 'JSON with requirements (array of requirement objects), epics (array), missingRequirements (array), clarificationsNeeded (array), assumptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
              businessValue: { type: 'string' },
              stakeholder: { type: 'string' },
              epic: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        epics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              requirementIds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        missingRequirements: { type: 'array', items: { type: 'string' } },
        clarificationsNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              question: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        qualityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moscow', 'requirements-gathering']
}));

// Task 2: MoSCoW Categorization
export const moscowCategorizationTask = defineTask('moscow-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize requirements using MoSCoW framework',
  agent: {
    name: 'prioritization-expert',
    prompt: {
      role: 'product prioritization expert and business analyst',
      task: 'Categorize requirements into Must, Should, Could, Won\'t have using MoSCoW framework',
      context: args,
      instructions: [
        'Apply MoSCoW prioritization framework:',
        '',
        'MUST HAVE (M):',
        '  - Requirements critical to current delivery',
        '  - Without these, the product/release fails or is unusable',
        '  - Non-negotiable, must be included',
        '  - Legal, regulatory, or safety requirements',
        '  - Core functionality that defines the product',
        '  - Rule of thumb: ~60% of total requirements',
        '',
        'SHOULD HAVE (S):',
        '  - Important but not vital',
        '  - Product can function without them, but less effectively',
        '  - High value, but workarounds exist',
        '  - Painful to leave out, but not critical',
        '  - Significant impact on user satisfaction',
        '  - Rule of thumb: ~20% of total requirements',
        '',
        'COULD HAVE (C):',
        '  - Desirable but not necessary',
        '  - Nice to have if time/resources permit',
        '  - Small value-add features',
        '  - Can be easily removed if timeline pressure',
        '  - Rule of thumb: ~20% of total requirements',
        '',
        'WON\'T HAVE (W):',
        '  - Agreed to be out of scope for this timeframe',
        '  - Not a priority right now',
        '  - May be included in future releases',
        '  - Helps manage expectations',
        '  - Explicitly de-prioritized',
        '',
        'For each requirement, provide:',
        '  - Category assignment (M/S/C/W)',
        '  - Rationale for categorization',
        '  - Impact assessment',
        '  - Risk assessment if excluded',
        '',
        'Consider:',
        '  - Business goals alignment',
        '  - Time constraints',
        '  - Resource constraints',
        '  - Technical dependencies',
        '  - User impact',
        '  - Competitive advantage',
        '',
        'Validate that Must-haves are truly essential',
        'Ensure balanced distribution across categories',
        'Document categorization rationale',
        'Save categorization to output directory'
      ],
      outputFormat: 'JSON with categorization (object with must/should/could/wont arrays), rationale (object), coveragePercentage (number), balanceAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categorization', 'rationale', 'artifacts'],
      properties: {
        categorization: {
          type: 'object',
          properties: {
            must: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  requirementId: { type: 'string' },
                  title: { type: 'string' },
                  rationale: { type: 'string' },
                  impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  riskIfExcluded: { type: 'string' }
                }
              }
            },
            should: { type: 'array' },
            could: { type: 'array' },
            wont: { type: 'array' }
          }
        },
        rationale: {
          type: 'object',
          properties: {
            overallApproach: { type: 'string' },
            keyDecisionFactors: { type: 'array', items: { type: 'string' } },
            tradeoffs: { type: 'array', items: { type: 'string' } }
          }
        },
        coveragePercentage: { type: 'number' },
        balanceAnalysis: {
          type: 'object',
          properties: {
            mustPercentage: { type: 'number' },
            shouldPercentage: { type: 'number' },
            couldPercentage: { type: 'number' },
            wontPercentage: { type: 'number' },
            balanceHealthy: { type: 'boolean' },
            recommendations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'moscow', 'categorization', 'prioritization']
}));

// Task 3: Stakeholder Validation
export const stakeholderValidationTask = defineTask('stakeholder-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate prioritization with stakeholders',
  agent: {
    name: 'stakeholder-facilitator',
    prompt: {
      role: 'product manager and stakeholder engagement specialist',
      task: 'Facilitate stakeholder validation workshop for MoSCoW prioritization',
      context: args,
      instructions: [
        'Simulate stakeholder validation workshop',
        'For each stakeholder, evaluate:',
        '  - Agreement with Must-have categorization',
        '  - Concerns about Should-have items',
        '  - Suggestions for re-categorization',
        '  - Additional requirements needed',
        'Document stakeholder perspectives:',
        '  - Business stakeholders (revenue, market, strategy)',
        '  - Technical stakeholders (feasibility, architecture, tech debt)',
        '  - User representatives (usability, value, satisfaction)',
        '  - Compliance/Legal (regulatory, risk, security)',
        'Identify conflicts and disagreements',
        'Document consensus areas',
        'Calculate alignment score (0-100)',
        'Prioritize change requests by:',
        '  - Number of stakeholders affected',
        '  - Severity of concern',
        '  - Impact on business goals',
        'Recommend conflict resolution approach',
        'Document workshop outcomes',
        'Save validation report to output directory'
      ],
      outputFormat: 'JSON with participatingStakeholders (array), feedback (array), changesRequested (array), conflicts (array), consensusAchieved (boolean), alignmentScore (number), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['participatingStakeholders', 'feedback', 'alignmentScore', 'artifacts'],
      properties: {
        participatingStakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              department: { type: 'string' }
            }
          }
        },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              requirementId: { type: 'string' },
              currentCategory: { type: 'string' },
              comment: { type: 'string' },
              agreement: { type: 'boolean' }
            }
          }
        },
        changesRequested: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              fromCategory: { type: 'string' },
              toCategory: { type: 'string' },
              requestedBy: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              description: { type: 'string' },
              stakeholdersInvolved: { type: 'array', items: { type: 'string' } },
              resolutionApproach: { type: 'string' }
            }
          }
        },
        consensusAchieved: { type: 'boolean' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moscow', 'stakeholder-validation', 'workshop']
}));

// Task 4: Categorization Refinement
export const categorizationRefinementTask = defineTask('categorization-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine categorization based on stakeholder feedback',
  agent: {
    name: 'prioritization-expert',
    prompt: {
      role: 'product prioritization expert',
      task: 'Refine MoSCoW categorization based on stakeholder feedback',
      context: args,
      instructions: [
        'Review all stakeholder feedback and change requests',
        'Evaluate each change request:',
        '  - Validity of rationale',
        '  - Impact on overall prioritization',
        '  - Alignment with business goals',
        '  - Support from multiple stakeholders',
        'Apply approved changes to categorization',
        'Resolve conflicts using:',
        '  - Business value assessment',
        '  - Urgency and impact analysis',
        '  - Stakeholder influence mapping',
        '  - Data-driven decision criteria',
        'For disputed items, recommend escalation or further discussion',
        'Maintain MoSCoW balance (roughly 60% M, 20% S, 20% C)',
        'Document all changes made and rationale',
        'Update categorization rationale',
        'Save refined categorization to output directory'
      ],
      outputFormat: 'JSON with categorization (updated object), changesApplied (array), conflictsResolved (array), escalationsNeeded (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categorization', 'changesApplied', 'artifacts'],
      properties: {
        categorization: {
          type: 'object',
          properties: {
            must: { type: 'array' },
            should: { type: 'array' },
            could: { type: 'array' },
            wont: { type: 'array' }
          }
        },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              fromCategory: { type: 'string' },
              toCategory: { type: 'string' },
              reason: { type: 'string' },
              approvedBy: { type: 'string' }
            }
          }
        },
        conflictsResolved: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              resolution: { type: 'string' },
              finalCategory: { type: 'string' }
            }
          }
        },
        escalationsNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              issue: { type: 'string' },
              stakeholders: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'moscow', 'refinement']
}));

// Task 5: Dependency Analysis
export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze requirement dependencies',
  agent: {
    name: 'technical-analyst',
    prompt: {
      role: 'technical analyst and system architect',
      task: 'Analyze dependencies between requirements',
      context: args,
      instructions: [
        'Identify dependencies between requirements:',
        '  - Technical dependencies (A requires B to function)',
        '  - Data dependencies (A needs data from B)',
        '  - User flow dependencies (B must come before A in user journey)',
        '  - Business logic dependencies',
        'For each requirement, document:',
        '  - Prerequisites (what must be done first)',
        '  - Dependents (what depends on this)',
        '  - Optional dependencies (nice to have together)',
        '  - Blocking dependencies (cannot proceed without)',
        'Create dependency graph/matrix',
        'Identify:',
        '  - Critical path items',
        '  - Circular dependencies',
        '  - Bottleneck requirements',
        '  - Parallel work opportunities',
        'Validate that Must-have dependencies are also Must-haves',
        'Flag risks where Must-have depends on Should/Could-have',
        'Recommend dependency resolution strategies',
        'Save dependency analysis to output directory'
      ],
      outputFormat: 'JSON with dependencies (array), dependencyGraph (object), criticalPath (array), risks (array), recommendations (array), dependencySummary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'dependencySummary', 'artifacts'],
      properties: {
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } },
              dependents: { type: 'array', items: { type: 'string' } },
              type: { type: 'string', enum: ['technical', 'data', 'userflow', 'business'] },
              criticality: { type: 'string', enum: ['blocking', 'required', 'optional'] }
            }
          }
        },
        dependencyGraph: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              requirementIds: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        dependencySummary: {
          type: 'object',
          properties: {
            totalDependencies: { type: 'number' },
            blockingDependencies: { type: 'number' },
            circularDependencies: { type: 'number' },
            complexityScore: { type: 'number' }
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
  labels: ['agent', 'moscow', 'dependency-analysis']
}));

// Task 6: Effort and Value Estimation
export const effortValueEstimationTask = defineTask('effort-value-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate effort and business value',
  agent: {
    name: 'estimation-expert',
    prompt: {
      role: 'agile estimation expert and business analyst',
      task: 'Estimate development effort and business value for each requirement',
      context: args,
      instructions: [
        'For each requirement, estimate:',
        '',
        'EFFORT:',
        '  - Development effort (story points or hours)',
        '  - Design effort',
        '  - Testing effort',
        '  - Deployment effort',
        '  - Documentation effort',
        '  - Use T-shirt sizing if detailed estimates unavailable (XS, S, M, L, XL)',
        '  - Consider technical complexity, uncertainty, team experience',
        '  - Include dependency overhead',
        '',
        'BUSINESS VALUE:',
        '  - User value (impact on user satisfaction/productivity)',
        '  - Business value (revenue, cost savings, competitive advantage)',
        '  - Strategic value (alignment with long-term goals)',
        '  - Risk reduction value (technical debt, security, compliance)',
        '  - Score each dimension 1-10',
        '  - Calculate weighted value score',
        '',
        'Calculate:',
        '  - Value-to-effort ratio (ROI)',
        '  - Cumulative effort by category (M, S, C, W)',
        '  - Value distribution analysis',
        '',
        'Validate that:',
        '  - Must-haves have high value justification',
        '  - Won\'t-haves have low value or very high effort',
        '  - Effort totals are realistic for timeframe',
        '',
        'Identify quick wins (high value, low effort)',
        'Flag money pits (low value, high effort)',
        'Recommend effort optimization strategies',
        'Save estimation data to output directory'
      ],
      outputFormat: 'JSON with estimates (array), totalEffort (string), totalValue (number), roi (object), quickWins (array), moneyPits (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimates', 'totalEffort', 'totalValue', 'artifacts'],
      properties: {
        estimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              effort: {
                type: 'object',
                properties: {
                  development: { type: 'string' },
                  design: { type: 'string' },
                  testing: { type: 'string' },
                  total: { type: 'string' },
                  confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
              },
              value: {
                type: 'object',
                properties: {
                  userValue: { type: 'number' },
                  businessValue: { type: 'number' },
                  strategicValue: { type: 'number' },
                  riskReductionValue: { type: 'number' },
                  totalValue: { type: 'number' }
                }
              },
              roi: { type: 'number' }
            }
          }
        },
        totalEffort: { type: 'string' },
        totalValue: { type: 'number' },
        roi: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            byCategory: {
              type: 'object',
              properties: {
                must: { type: 'number' },
                should: { type: 'number' },
                could: { type: 'number' }
              }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              title: { type: 'string' },
              value: { type: 'number' },
              effort: { type: 'string' }
            }
          }
        },
        moneyPits: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moscow', 'estimation']
}));

// Task 7: Release Scope Definition
export const releaseScopeDefinitionTask = defineTask('release-scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define release scope and iterations',
  agent: {
    name: 'release-planner',
    prompt: {
      role: 'agile release planner and delivery manager',
      task: 'Define release scope, iterations, and delivery milestones',
      context: args,
      instructions: [
        'Based on MoSCoW prioritization and timeframe, define release scope',
        '',
        'RELEASE 1 (MVP):',
        '  - Include all Must-have requirements',
        '  - Add critical dependencies even if Should/Could',
        '  - Ensure coherent user experience',
        '  - Validate effort fits timeframe',
        '  - Define MVP success criteria',
        '',
        'SUBSEQUENT RELEASES:',
        '  - Group Should-haves by value and theme',
        '  - Include Could-haves if capacity permits',
        '  - Balance value delivery with technical sustainability',
        '  - Consider market timing and competitive factors',
        '',
        'For each release:',
        '  - List included requirements',
        '  - Estimate total effort',
        '  - Define delivery timeline',
        '  - Identify key milestones',
        '  - Define success metrics',
        '  - List dependencies and risks',
        '',
        'Create iteration/sprint breakdown:',
        '  - Group requirements into logical sprints',
        '  - Respect dependencies and critical path',
        '  - Balance team capacity',
        '  - Include buffer for unknowns (15-20%)',
        '',
        'Validate feasibility:',
        '  - Check resource availability',
        '  - Verify technical readiness',
        '  - Assess team velocity',
        '  - Consider holidays, leave, other commitments',
        '',
        'Document release strategy',
        'Save release plan to output directory'
      ],
      outputFormat: 'JSON with releases (array), iterations (array), feasibilityAssessment (object), risks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['releases', 'feasibilityAssessment', 'artifacts'],
      properties: {
        releases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              releaseNumber: { type: 'number' },
              name: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' },
              timeline: { type: 'string' },
              milestones: { type: 'array', items: { type: 'string' } },
              successMetrics: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        iterations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iterationNumber: { type: 'number' },
              releaseNumber: { type: 'number' },
              requirements: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        feasibilityAssessment: {
          type: 'object',
          properties: {
            feasible: { type: 'boolean' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            concerns: { type: 'array', items: { type: 'string' } },
            mitigations: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moscow', 'release-planning']
}));

// Task 8: MVP Specification
export const mvpSpecificationTask = defineTask('mvp-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify Minimum Viable Product (MVP)',
  agent: {
    name: 'product-strategist',
    prompt: {
      role: 'product strategist and MVP expert',
      task: 'Create comprehensive MVP specification from Must-have requirements',
      context: args,
      instructions: [
        'Define Minimum Viable Product (MVP) that:',
        '  - Delivers core value proposition',
        '  - Addresses primary user needs',
        '  - Enables learning and feedback',
        '  - Can be built within timeframe',
        '  - Is genuinely viable (usable, valuable, feasible)',
        '',
        'MVP SCOPE:',
        '  - List all included Must-have requirements',
        '  - Add critical dependencies',
        '  - Define user flows covered',
        '  - Specify features included',
        '  - Document out-of-scope items',
        '',
        'MVP DEFINITION:',
        '  - Target users and use cases',
        '  - Core value proposition',
        '  - Key differentiators',
        '  - Success criteria',
        '  - Acceptance criteria',
        '',
        'MVP CHARACTERISTICS:',
        '  - What makes it "minimum"?',
        '  - What makes it "viable"?',
        '  - What makes it a "product"?',
        '  - What hypotheses does it test?',
        '',
        'EFFORT AND TIMELINE:',
        '  - Total effort estimate',
        '  - Delivery timeline',
        '  - Key milestones',
        '  - Resource requirements',
        '',
        'VALUE AND METRICS:',
        '  - Expected business value',
        '  - User value delivered',
        '  - Success metrics (leading indicators)',
        '  - KPIs to track post-launch',
        '',
        'RISKS AND ASSUMPTIONS:',
        '  - Key assumptions being made',
        '  - Technical risks',
        '  - Market risks',
        '  - Mitigation strategies',
        '',
        'POST-MVP EVOLUTION:',
        '  - What comes after MVP?',
        '  - How will we iterate?',
        '  - What feedback will we gather?',
        '',
        'Create MVP canvas or one-pager',
        'Save MVP specification to output directory'
      ],
      outputFormat: 'JSON with mvpScope (object with features, requirements, userFlows), valueProposition (string), successCriteria (array), effort (string), timeline (string), metrics (array), risks (array), postMvpPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mvpScope', 'valueProposition', 'successCriteria', 'artifacts'],
      properties: {
        mvpScope: {
          type: 'object',
          properties: {
            features: { type: 'array', items: { type: 'string' } },
            requirements: { type: 'array', items: { type: 'string' } },
            userFlows: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } },
            totalEffort: { type: 'string' },
            businessValue: { type: 'number' }
          }
        },
        valueProposition: { type: 'string' },
        targetUsers: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        characteristics: {
          type: 'object',
          properties: {
            minimum: { type: 'string' },
            viable: { type: 'string' },
            product: { type: 'string' },
            hypotheses: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: { type: 'string' },
        milestones: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        postMvpPlan: {
          type: 'object',
          properties: {
            nextSteps: { type: 'array', items: { type: 'string' } },
            feedbackMechanisms: { type: 'array', items: { type: 'string' } },
            iterationStrategy: { type: 'string' }
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
  labels: ['agent', 'moscow', 'mvp-specification']
}));

// Task 9: Roadmap Generation
export const roadmapGenerationTask = defineTask('roadmap-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate product roadmap',
  agent: {
    name: 'product-roadmap-specialist',
    prompt: {
      role: 'product roadmap specialist and strategic planner',
      task: 'Generate product roadmap showing release timeline and evolution',
      context: args,
      instructions: [
        'Create visual product roadmap showing:',
        '  - Release timeline',
        '  - Key features and capabilities by release',
        '  - Milestones and dependencies',
        '  - Strategic themes',
        '  - Value delivery over time',
        '',
        'Roadmap structure:',
        '  - Now (MVP / Release 1): Must-haves',
        '  - Next (Release 2-3): Should-haves',
        '  - Later (Future releases): Could-haves',
        '  - Won\'t: Explicitly out of scope',
        '',
        'For each roadmap item:',
        '  - Feature/theme name',
        '  - Target timeframe',
        '  - Business value',
        '  - Status',
        '  - Dependencies',
        '',
        'Include:',
        '  - Strategic goals alignment',
        '  - Market/competitive considerations',
        '  - Technical evolution',
        '  - Assumption and contingencies',
        '',
        'Create multiple views:',
        '  - Executive summary (themes and value)',
        '  - Detailed feature roadmap',
        '  - Technical roadmap',
        '  - Dependency roadmap',
        '',
        'Format as:',
        '  - Visual timeline (ASCII or mermaid diagram)',
        '  - Table format',
        '  - Narrative description',
        '',
        'Save roadmap artifacts to output directory'
      ],
      outputFormat: 'JSON with roadmap (object with timeline, themes, releases), visualizations (array), narrativeDescription (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'narrativeDescription', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timeframe: { type: 'string' },
                  releaseNumber: { type: 'number' },
                  theme: { type: 'string' },
                  features: { type: 'array', items: { type: 'string' } },
                  value: { type: 'string' }
                }
              }
            },
            themes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  releases: { type: 'array', items: { type: 'number' } }
                }
              }
            },
            strategicGoals: { type: 'array', items: { type: 'string' } }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              format: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        narrativeDescription: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moscow', 'roadmap']
}));

// Task 10: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final documentation and reports',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical writer and product documentation specialist',
      task: 'Generate comprehensive MoSCoW prioritization documentation',
      context: args,
      instructions: [
        'Create comprehensive documentation package:',
        '',
        '1. EXECUTIVE SUMMARY:',
        '   - Process overview',
        '   - Key outcomes',
        '   - MVP definition',
        '   - Release timeline',
        '   - Success metrics',
        '   - Stakeholder sign-offs',
        '',
        '2. PRIORITIZATION REPORT:',
        '   - MoSCoW categorization with rationale',
        '   - Requirements by category',
        '   - Stakeholder feedback summary',
        '   - Changes made during process',
        '   - Final alignment score',
        '',
        '3. MVP SPECIFICATION:',
        '   - Detailed MVP scope',
        '   - User stories included',
        '   - Success criteria',
        '   - Timeline and milestones',
        '   - Resources needed',
        '',
        '4. RELEASE PLAN:',
        '   - Multi-release roadmap',
        '   - Release scope by version',
        '   - Dependencies and critical path',
        '   - Risk assessment',
        '',
        '5. EFFORT AND VALUE ANALYSIS:',
        '   - Effort estimates by category',
        '   - Value scoring',
        '   - ROI analysis',
        '   - Quick wins identification',
        '',
        '6. DEPENDENCY MAP:',
        '   - Requirement dependencies',
        '   - Critical path',
        '   - Risks and mitigations',
        '',
        '7. STAKEHOLDER REGISTER:',
        '   - Participating stakeholders',
        '   - Feedback provided',
        '   - Concerns addressed',
        '   - Sign-off status',
        '',
        '8. APPENDICES:',
        '   - Full requirements catalog',
        '   - Estimation details',
        '   - Workshop notes',
        '   - Decision log',
        '',
        'Format documents professionally',
        'Include table of contents',
        'Add executive summary at top',
        'Use clear headings and formatting',
        'Include diagrams where helpful',
        'Save all documentation to output directory'
      ],
      outputFormat: 'JSON with documents (array of document objects), summaryReport (string), stakeholderPackage (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'summaryReport', 'artifacts'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              audience: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        summaryReport: { type: 'string' },
        stakeholderPackage: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            keyDecisions: { type: 'array', items: { type: 'string' } },
            nextSteps: { type: 'array', items: { type: 'string' } },
            approvalRequired: { type: 'boolean' }
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
  labels: ['agent', 'moscow', 'documentation']
}));
