/**
 * @process domains/business/knowledge-management/tacit-to-explicit-conversion
 * @description Apply SECI model techniques to transform tacit knowledge into explicit documentation through socialization, externalization, combination, and internalization processes
 * @specialization Knowledge Management
 * @category Knowledge Capture and Documentation
 * @inputs { knowledgeDomain: string, subjectMatterExperts: array, targetAudience: string, conversionGoals: object, existingDocumentation: array, outputDir: string }
 * @outputs { success: boolean, knowledgeAssets: array, seciAnalysis: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeDomain = '',
    subjectMatterExperts = [],
    targetAudience = 'general',
    conversionGoals = {},
    existingDocumentation = [],
    organizationalContext = {},
    seciPreferences = {
      socializationMethods: ['observation', 'shadowing', 'apprenticeship'],
      externalizationMethods: ['interviews', 'storytelling', 'modeling'],
      combinationMethods: ['synthesis', 'categorization', 'standardization'],
      internalizationMethods: ['training', 'practice', 'simulation']
    },
    validationRequirements = { expertReview: true, peerReview: true },
    outputDir = 'tacit-to-explicit-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Tacit to Explicit Knowledge Conversion Process (SECI Model)');

  // ============================================================================
  // PHASE 1: TACIT KNOWLEDGE DISCOVERY AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and assessing tacit knowledge landscape');
  const tacitKnowledgeAssessment = await ctx.task(tacitKnowledgeAssessmentTask, {
    knowledgeDomain,
    subjectMatterExperts,
    existingDocumentation,
    organizationalContext,
    outputDir
  });

  artifacts.push(...tacitKnowledgeAssessment.artifacts);

  if (!tacitKnowledgeAssessment.hasTacitKnowledge) {
    ctx.log('warn', 'No significant tacit knowledge identified for conversion');
    return {
      success: false,
      reason: 'No significant tacit knowledge identified',
      recommendations: tacitKnowledgeAssessment.recommendations,
      metadata: {
        processId: 'domains/business/knowledge-management/tacit-to-explicit-conversion',
        timestamp: startTime
      }
    };
  }

  // Breakpoint: Review tacit knowledge assessment
  await ctx.breakpoint({
    question: `Identified ${tacitKnowledgeAssessment.tacitKnowledgeAreas.length} tacit knowledge areas for conversion. Review assessment?`,
    title: 'Tacit Knowledge Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        knowledgeDomain,
        expertsIdentified: subjectMatterExperts.length,
        tacitKnowledgeAreas: tacitKnowledgeAssessment.tacitKnowledgeAreas.length,
        conversionComplexity: tacitKnowledgeAssessment.conversionComplexity
      }
    }
  });

  // ============================================================================
  // PHASE 2: SOCIALIZATION - TACIT TO TACIT
  // ============================================================================

  ctx.log('info', 'Phase 2: Socialization - Facilitating tacit-to-tacit knowledge sharing');
  const socializationResult = await ctx.task(socializationTask, {
    knowledgeDomain,
    tacitKnowledgeAreas: tacitKnowledgeAssessment.tacitKnowledgeAreas,
    subjectMatterExperts,
    socializationMethods: seciPreferences.socializationMethods,
    organizationalContext,
    outputDir
  });

  artifacts.push(...socializationResult.artifacts);

  // ============================================================================
  // PHASE 3: EXTERNALIZATION - TACIT TO EXPLICIT
  // ============================================================================

  ctx.log('info', 'Phase 3: Externalization - Converting tacit knowledge to explicit form');
  const externalizationResult = await ctx.task(externalizationTask, {
    knowledgeDomain,
    tacitKnowledgeAreas: tacitKnowledgeAssessment.tacitKnowledgeAreas,
    socializationInsights: socializationResult.insights,
    subjectMatterExperts,
    externalizationMethods: seciPreferences.externalizationMethods,
    targetAudience,
    outputDir
  });

  artifacts.push(...externalizationResult.artifacts);

  // Breakpoint: Review externalized knowledge
  await ctx.breakpoint({
    question: `Externalized ${externalizationResult.explicitKnowledgeAssets.length} knowledge assets. Review externalization results?`,
    title: 'Externalization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        assetsCreated: externalizationResult.explicitKnowledgeAssets.length,
        methodsUsed: externalizationResult.methodsUsed,
        coveragePercentage: externalizationResult.coveragePercentage
      }
    }
  });

  // ============================================================================
  // PHASE 4: COMBINATION - EXPLICIT TO EXPLICIT
  // ============================================================================

  ctx.log('info', 'Phase 4: Combination - Synthesizing and organizing explicit knowledge');
  const combinationResult = await ctx.task(combinationTask, {
    knowledgeDomain,
    explicitKnowledgeAssets: externalizationResult.explicitKnowledgeAssets,
    existingDocumentation,
    combinationMethods: seciPreferences.combinationMethods,
    targetAudience,
    outputDir
  });

  artifacts.push(...combinationResult.artifacts);

  // ============================================================================
  // PHASE 5: INTERNALIZATION PLANNING - EXPLICIT TO TACIT
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning internalization activities');
  const internalizationPlan = await ctx.task(internalizationPlanningTask, {
    knowledgeDomain,
    combinedKnowledge: combinationResult.combinedAssets,
    targetAudience,
    internalizationMethods: seciPreferences.internalizationMethods,
    organizationalContext,
    outputDir
  });

  artifacts.push(...internalizationPlan.artifacts);

  // ============================================================================
  // PHASE 6: KNOWLEDGE ASSET DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting final knowledge assets');
  const knowledgeDocumentation = await ctx.task(knowledgeDocumentationTask, {
    knowledgeDomain,
    combinedAssets: combinationResult.combinedAssets,
    externalizationResult,
    internalizationPlan,
    targetAudience,
    outputDir
  });

  artifacts.push(...knowledgeDocumentation.artifacts);

  // ============================================================================
  // PHASE 7: EXPERT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating knowledge assets with subject matter experts');
  const expertValidation = await ctx.task(expertValidationTask, {
    knowledgeDomain,
    knowledgeAssets: knowledgeDocumentation.finalAssets,
    subjectMatterExperts,
    validationRequirements,
    outputDir
  });

  artifacts.push(...expertValidation.artifacts);

  const validationPassed = expertValidation.overallScore >= 80;

  // Breakpoint: Review expert validation
  await ctx.breakpoint({
    question: `Expert validation score: ${expertValidation.overallScore}/100. ${validationPassed ? 'Validation passed!' : 'May need revisions.'} Review validation results?`,
    title: 'Expert Validation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        validationScore: expertValidation.overallScore,
        validationPassed,
        expertsReviewed: expertValidation.expertsReviewed,
        issuesIdentified: expertValidation.issues.length
      }
    }
  });

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing overall quality of knowledge conversion');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    knowledgeDomain,
    tacitKnowledgeAssessment,
    socializationResult,
    externalizationResult,
    combinationResult,
    internalizationPlan,
    expertValidation,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 9: KNOWLEDGE INTEGRATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning integration into organizational knowledge systems');
  const integrationPlan = await ctx.task(integrationPlanningTask, {
    knowledgeDomain,
    knowledgeAssets: knowledgeDocumentation.finalAssets,
    organizationalContext,
    existingDocumentation,
    outputDir
  });

  artifacts.push(...integrationPlan.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      knowledgeDomain,
      knowledgeAssets: knowledgeDocumentation.finalAssets,
      qualityScore: qualityAssessment.overallScore,
      expertValidation,
      integrationPlan,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize knowledge conversion?`,
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
    knowledgeDomain,
    knowledgeAssets: knowledgeDocumentation.finalAssets,
    seciAnalysis: {
      socialization: {
        methodsUsed: socializationResult.methodsUsed,
        insightsGathered: socializationResult.insights.length
      },
      externalization: {
        assetsCreated: externalizationResult.explicitKnowledgeAssets.length,
        coveragePercentage: externalizationResult.coveragePercentage
      },
      combination: {
        synthesizedAssets: combinationResult.combinedAssets.length,
        connectionsIdentified: combinationResult.connectionsIdentified
      },
      internalization: {
        activitiesPlanned: internalizationPlan.activities.length,
        learningPathways: internalizationPlan.learningPathways.length
      }
    },
    qualityScore: qualityAssessment.overallScore,
    validation: {
      expertValidationScore: expertValidation.overallScore,
      validationPassed,
      expertsReviewed: expertValidation.expertsReviewed
    },
    statistics: {
      tacitKnowledgeAreasIdentified: tacitKnowledgeAssessment.tacitKnowledgeAreas.length,
      explicitAssetsCreated: externalizationResult.explicitKnowledgeAssets.length,
      finalAssetsProduced: knowledgeDocumentation.finalAssets.length,
      expertsInvolved: subjectMatterExperts.length
    },
    integration: {
      planned: true,
      targetSystems: integrationPlan.targetSystems,
      timeline: integrationPlan.timeline
    },
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/tacit-to-explicit-conversion',
      timestamp: startTime,
      outputDir,
      targetAudience
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Tacit Knowledge Assessment
export const tacitKnowledgeAssessmentTask = defineTask('tacit-knowledge-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess tacit knowledge landscape',
  agent: {
    name: 'knowledge-analyst',
    prompt: {
      role: 'knowledge analyst specializing in tacit knowledge identification',
      task: 'Discover and assess tacit knowledge within the specified domain',
      context: args,
      instructions: [
        'Analyze the knowledge domain and organizational context',
        'Identify tacit knowledge areas held by subject matter experts:',
        '  - Skills and competencies (know-how)',
        '  - Mental models and frameworks (know-why)',
        '  - Intuition and judgment (know-when)',
        '  - Relationships and networks (know-who)',
        '  - Contextual understanding (know-where)',
        'Assess tacit knowledge characteristics:',
        '  - Depth and complexity',
        '  - Criticality to operations',
        '  - Risk of loss (retirement, turnover)',
        '  - Difficulty of transfer',
        'Map existing documentation gaps',
        'Identify knowledge holders and their expertise areas',
        'Assess organizational readiness for knowledge conversion',
        'Evaluate conversion complexity and effort required',
        'Prioritize tacit knowledge areas for conversion',
        'Provide recommendations for conversion approach',
        'Save tacit knowledge assessment to output directory'
      ],
      outputFormat: 'JSON with hasTacitKnowledge (boolean), tacitKnowledgeAreas (array), expertiseMap (object), conversionComplexity (string), prioritizedAreas (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasTacitKnowledge', 'tacitKnowledgeAreas', 'conversionComplexity', 'artifacts'],
      properties: {
        hasTacitKnowledge: { type: 'boolean' },
        tacitKnowledgeAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['know-how', 'know-why', 'know-when', 'know-who', 'know-where'] },
              description: { type: 'string' },
              experts: { type: 'array', items: { type: 'string' } },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              transferDifficulty: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              lossRisk: { type: 'string', enum: ['immediate', 'short-term', 'medium-term', 'low'] }
            }
          }
        },
        expertiseMap: { type: 'object' },
        conversionComplexity: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
        prioritizedAreas: { type: 'array', items: { type: 'string' } },
        documentationGaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'tacit-knowledge', 'assessment']
}));

// Task 2: Socialization
export const socializationTask = defineTask('socialization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Facilitate socialization (tacit to tacit)',
  agent: {
    name: 'knowledge-facilitator',
    prompt: {
      role: 'knowledge facilitator specializing in socialization techniques',
      task: 'Design and plan socialization activities for tacit-to-tacit knowledge sharing',
      context: args,
      instructions: [
        'Design socialization activities based on SECI model:',
        '  - Observation and shadowing programs',
        '  - Apprenticeship and mentoring arrangements',
        '  - Joint problem-solving sessions',
        '  - Informal knowledge sharing events',
        '  - Communities of practice activities',
        'Plan expert pairing and knowledge transfer sessions',
        'Design experiential learning opportunities',
        'Create shared experience contexts for knowledge transfer',
        'Plan storytelling and narrative sharing sessions',
        'Identify optimal environments for knowledge sharing',
        'Design trust-building and relationship activities',
        'Create observation protocols and guides',
        'Plan reflection and debrief sessions',
        'Document insights gathered from socialization activities',
        'Identify patterns and themes from shared experiences',
        'Save socialization plan and insights to output directory'
      ],
      outputFormat: 'JSON with insights (array), methodsUsed (array), activities (array), pairingRecommendations (array), environmentalFactors (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'methodsUsed', 'activities', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              insight: { type: 'string' },
              source: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        methodsUsed: { type: 'array', items: { type: 'string' } },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              expectedOutcomes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pairingRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              expert: { type: 'string' },
              learner: { type: 'string' },
              knowledgeArea: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        environmentalFactors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'seci', 'socialization']
}));

// Task 3: Externalization
export const externalizationTask = defineTask('externalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Convert tacit to explicit knowledge (externalization)',
  agent: {
    name: 'knowledge-externalizer',
    prompt: {
      role: 'knowledge engineer specializing in externalization techniques',
      task: 'Convert tacit knowledge into explicit, documented form',
      context: args,
      instructions: [
        'Apply externalization techniques to convert tacit knowledge:',
        '  - Structured interviews and knowledge elicitation',
        '  - Storytelling and case study documentation',
        '  - Process mapping and workflow documentation',
        '  - Decision tree and rule extraction',
        '  - Mental model diagramming',
        '  - Concept mapping and knowledge graphs',
        '  - Metaphor and analogy development',
        '  - Pattern language documentation',
        'Create explicit knowledge assets for each tacit area:',
        '  - Procedures and how-to guides',
        '  - Decision frameworks and heuristics',
        '  - Best practices and guidelines',
        '  - Lessons learned documents',
        '  - Case studies and examples',
        '  - Checklists and templates',
        'Use appropriate formats for different knowledge types',
        'Capture context and conditions for knowledge application',
        'Include expert rationale and reasoning',
        'Document exceptions, edge cases, and variations',
        'Calculate coverage percentage of tacit knowledge areas',
        'Save explicit knowledge assets to output directory'
      ],
      outputFormat: 'JSON with explicitKnowledgeAssets (array), methodsUsed (array), coveragePercentage (number), conversionChallenges (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['explicitKnowledgeAssets', 'methodsUsed', 'coveragePercentage', 'artifacts'],
      properties: {
        explicitKnowledgeAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['procedure', 'decision-framework', 'best-practice', 'lesson-learned', 'case-study', 'checklist', 'template', 'guideline'] },
              sourceTacitArea: { type: 'string' },
              description: { type: 'string' },
              format: { type: 'string' },
              expertSource: { type: 'string' },
              completeness: { type: 'string', enum: ['complete', 'partial', 'draft'] }
            }
          }
        },
        methodsUsed: { type: 'array', items: { type: 'string' } },
        coveragePercentage: { type: 'number', minimum: 0, maximum: 100 },
        conversionChallenges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              challenge: { type: 'string' },
              mitigation: { type: 'string' }
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
  labels: ['agent', 'knowledge-management', 'seci', 'externalization']
}));

// Task 4: Combination
export const combinationTask = defineTask('combination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize and organize explicit knowledge (combination)',
  agent: {
    name: 'knowledge-synthesizer',
    prompt: {
      role: 'knowledge architect specializing in knowledge synthesis',
      task: 'Combine, synthesize, and organize explicit knowledge assets',
      context: args,
      instructions: [
        'Combine and synthesize explicit knowledge assets:',
        '  - Integrate with existing documentation',
        '  - Identify connections and relationships',
        '  - Remove redundancies and inconsistencies',
        '  - Standardize formats and terminology',
        '  - Create unified knowledge structures',
        'Organize knowledge using appropriate structures:',
        '  - Hierarchical organization (categories, subcategories)',
        '  - Network organization (links, relationships)',
        '  - Sequential organization (processes, workflows)',
        'Create knowledge frameworks and models:',
        '  - Conceptual frameworks',
        '  - Reference architectures',
        '  - Knowledge maps',
        'Develop cross-references and navigation aids',
        'Create executive summaries and overviews',
        'Identify knowledge gaps after combination',
        'Ensure completeness and coherence',
        'Apply taxonomy and metadata',
        'Create knowledge asset catalog',
        'Save combined knowledge assets to output directory'
      ],
      outputFormat: 'JSON with combinedAssets (array), connectionsIdentified (number), knowledgeMap (object), redundanciesRemoved (array), gapsIdentified (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['combinedAssets', 'connectionsIdentified', 'artifacts'],
      properties: {
        combinedAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              sourceAssets: { type: 'array', items: { type: 'string' } },
              relatedAssets: { type: 'array', items: { type: 'string' } },
              categories: { type: 'array', items: { type: 'string' } },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        connectionsIdentified: { type: 'number' },
        knowledgeMap: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' },
            clusters: { type: 'array' }
          }
        },
        redundanciesRemoved: { type: 'array', items: { type: 'string' } },
        gapsIdentified: { type: 'array', items: { type: 'string' } },
        standardizationApplied: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'seci', 'combination']
}));

// Task 5: Internalization Planning
export const internalizationPlanningTask = defineTask('internalization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan internalization activities (explicit to tacit)',
  agent: {
    name: 'learning-designer',
    prompt: {
      role: 'learning designer specializing in knowledge internalization',
      task: 'Design internalization activities to convert explicit knowledge back to tacit',
      context: args,
      instructions: [
        'Design internalization activities based on SECI model:',
        '  - Training programs and workshops',
        '  - Hands-on practice and exercises',
        '  - Simulations and role-playing',
        '  - Learning-by-doing opportunities',
        '  - Case study analysis',
        '  - Reflection and journaling activities',
        'Create learning pathways for different audiences:',
        '  - Novice pathway (foundational learning)',
        '  - Intermediate pathway (skill building)',
        '  - Advanced pathway (mastery development)',
        'Design practice environments and opportunities',
        'Create assessment and competency verification methods',
        'Plan feedback mechanisms and coaching support',
        'Design spaced repetition and reinforcement activities',
        'Create job aids and performance support tools',
        'Plan communities of practice integration',
        'Define success criteria and learning outcomes',
        'Save internalization plan to output directory'
      ],
      outputFormat: 'JSON with activities (array), learningPathways (array), assessmentMethods (array), supportTools (array), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'learningPathways', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['training', 'workshop', 'practice', 'simulation', 'case-study', 'reflection', 'coaching'] },
              knowledgeAsset: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string', enum: ['in-person', 'virtual', 'self-paced', 'blended'] },
              outcomes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        learningPathways: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              targetAudience: { type: 'string' },
              level: { type: 'string', enum: ['novice', 'intermediate', 'advanced'] },
              activities: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              outcomes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assessmentMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' }
            }
          }
        },
        supportTools: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'seci', 'internalization']
}));

// Task 6: Knowledge Documentation
export const knowledgeDocumentationTask = defineTask('knowledge-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document final knowledge assets',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer specializing in knowledge documentation',
      task: 'Create comprehensive documentation for converted knowledge assets',
      context: args,
      instructions: [
        'Create final documentation for all knowledge assets:',
        '  - Standardized formatting and structure',
        '  - Clear and accessible language',
        '  - Appropriate detail level for audience',
        '  - Visual aids and diagrams where helpful',
        'Include essential metadata for each asset:',
        '  - Title and description',
        '  - Author and expert sources',
        '  - Creation and review dates',
        '  - Version and change history',
        '  - Related assets and prerequisites',
        '  - Target audience and use cases',
        'Create navigation and discovery aids:',
        '  - Table of contents and indexes',
        '  - Cross-references and links',
        '  - Search keywords and tags',
        'Develop supporting materials:',
        '  - Quick reference guides',
        '  - Glossaries and definitions',
        '  - FAQs and common questions',
        'Ensure accessibility and usability',
        'Create asset catalog and inventory',
        'Save final documentation to output directory'
      ],
      outputFormat: 'JSON with finalAssets (array), assetCatalog (object), supportingMaterials (array), metadata (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['finalAssets', 'assetCatalog', 'artifacts'],
      properties: {
        finalAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' },
              experts: { type: 'array', items: { type: 'string' } },
              audience: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              relatedAssets: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assetCatalog: {
          type: 'object',
          properties: {
            totalAssets: { type: 'number' },
            byType: { type: 'object' },
            byAudience: { type: 'object' }
          }
        },
        supportingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        metadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'documentation']
}));

// Task 7: Expert Validation
export const expertValidationTask = defineTask('expert-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate knowledge with subject matter experts',
  agent: {
    name: 'validation-coordinator',
    prompt: {
      role: 'validation coordinator facilitating expert review',
      task: 'Coordinate and summarize expert validation of converted knowledge',
      context: args,
      instructions: [
        'Design expert validation process:',
        '  - Assign reviewers to relevant knowledge assets',
        '  - Create validation criteria and rubrics',
        '  - Define review timeline and process',
        'Validation criteria to assess:',
        '  - Accuracy and correctness',
        '  - Completeness and coverage',
        '  - Clarity and understandability',
        '  - Relevance and usefulness',
        '  - Currency and timeliness',
        'Gather expert feedback and assessments',
        'Identify areas requiring revision',
        'Collect suggestions for improvement',
        'Calculate overall validation scores',
        'Document expert sign-offs and approvals',
        'Create validation report with findings',
        'Prioritize revisions based on severity',
        'Save validation results to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), expertsReviewed (number), issues (array), validationDetails (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'expertsReviewed', 'issues', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        expertsReviewed: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              asset: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              expert: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        validationDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              asset: { type: 'string' },
              reviewer: { type: 'string' },
              scores: {
                type: 'object',
                properties: {
                  accuracy: { type: 'number' },
                  completeness: { type: 'number' },
                  clarity: { type: 'number' },
                  relevance: { type: 'number' }
                }
              },
              approved: { type: 'boolean' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'validation', 'expert-review']
}));

// Task 8: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall quality of knowledge conversion',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'knowledge quality assessor',
      task: 'Evaluate the overall quality and effectiveness of the knowledge conversion process',
      context: args,
      instructions: [
        'Assess quality across SECI dimensions:',
        '  - Socialization effectiveness (25%): Tacit sharing quality',
        '  - Externalization quality (30%): Conversion accuracy and completeness',
        '  - Combination coherence (25%): Integration and organization',
        '  - Internalization readiness (20%): Learning design quality',
        'Evaluate knowledge asset quality:',
        '  - Accuracy and validity',
        '  - Completeness and coverage',
        '  - Accessibility and usability',
        '  - Maintainability and currency',
        'Assess conversion process quality:',
        '  - Expert engagement and participation',
        '  - Methodology rigor',
        '  - Validation thoroughness',
        'Calculate weighted overall score (0-100)',
        'Identify quality strengths and weaknesses',
        'Provide improvement recommendations',
        'Compare against best practices',
        'Save quality assessment report to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), seciScores (object), assetQuality (object), processQuality (object), strengths (array), weaknesses (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'seciScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        seciScores: {
          type: 'object',
          properties: {
            socialization: { type: 'number' },
            externalization: { type: 'number' },
            combination: { type: 'number' },
            internalization: { type: 'number' }
          }
        },
        assetQuality: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            completeness: { type: 'number' },
            accessibility: { type: 'number' },
            maintainability: { type: 'number' }
          }
        },
        processQuality: {
          type: 'object',
          properties: {
            expertEngagement: { type: 'number' },
            methodologyRigor: { type: 'number' },
            validationThoroughness: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality-assessment']
}));

// Task 9: Integration Planning
export const integrationPlanningTask = defineTask('integration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan integration into knowledge systems',
  agent: {
    name: 'integration-planner',
    prompt: {
      role: 'knowledge systems integration specialist',
      task: 'Plan integration of converted knowledge into organizational systems',
      context: args,
      instructions: [
        'Identify target knowledge management systems:',
        '  - Knowledge bases and wikis',
        '  - Learning management systems',
        '  - Document management systems',
        '  - Collaboration platforms',
        'Plan integration approach for each system:',
        '  - Content migration and import',
        '  - Metadata mapping and tagging',
        '  - Navigation and discovery setup',
        '  - Access control and permissions',
        'Define integration timeline and milestones',
        'Identify dependencies and prerequisites',
        'Plan content ownership assignment',
        'Design maintenance and update workflows',
        'Create communication plan for stakeholders',
        'Plan training for content consumers',
        'Define success metrics and monitoring',
        'Create rollback and contingency plans',
        'Save integration plan to output directory'
      ],
      outputFormat: 'JSON with targetSystems (array), integrationApproach (object), timeline (object), dependencies (array), maintenancePlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetSystems', 'integrationApproach', 'timeline', 'artifacts'],
      properties: {
        targetSystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              contentTypes: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        integrationApproach: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            phases: { type: 'array' },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            milestones: { type: 'array' }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        maintenancePlan: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'integration', 'planning']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of knowledge conversion',
      context: args,
      instructions: [
        'Present knowledge conversion results to stakeholders:',
        '  - Knowledge assets created',
        '  - Quality assessment results',
        '  - Expert validation findings',
        '  - Integration plan',
        'Gather feedback from key stakeholders:',
        '  - Subject matter experts',
        '  - Knowledge consumers and users',
        '  - Management and leadership',
        '  - IT and systems owners',
        'Validate that conversion meets objectives',
        'Review resource requirements for integration',
        'Identify concerns and objections',
        'Categorize feedback by severity',
        'Determine if revisions are needed',
        'Document approval or required changes',
        'Create action plan for addressing feedback',
        'Save stakeholder review report to output directory'
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
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
