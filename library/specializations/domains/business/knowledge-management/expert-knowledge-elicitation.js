/**
 * @process domains/business/knowledge-management/expert-knowledge-elicitation
 * @description Conduct structured interviews and observation sessions with subject matter experts to capture tacit knowledge, document expertise, and externalize critical organizational knowledge
 * @specialization Knowledge Management
 * @category Knowledge Capture and Documentation
 * @inputs { knowledgeDomain: string, experts: array, elicitationGoals: object, existingKnowledge: array, outputDir: string }
 * @outputs { success: boolean, capturedKnowledge: array, elicitationSessions: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeDomain = '',
    experts = [],
    elicitationGoals = {},
    existingKnowledge = [],
    organizationalContext = {},
    elicitationMethods = {
      structuredInterviews: true,
      observation: true,
      thinkAloud: true,
      criticalIncidentTechnique: true,
      conceptMapping: true
    },
    sessionParameters = {
      typicalDuration: '60-90 minutes',
      recordingAllowed: true,
      followUpSessions: true
    },
    outputDir = 'expert-elicitation-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Expert Knowledge Elicitation Process');

  // ============================================================================
  // PHASE 1: ELICITATION PLANNING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning and preparing knowledge elicitation');
  const elicitationPlan = await ctx.task(elicitationPlanningTask, {
    knowledgeDomain,
    experts,
    elicitationGoals,
    existingKnowledge,
    elicitationMethods,
    sessionParameters,
    outputDir
  });

  artifacts.push(...elicitationPlan.artifacts);

  if (!elicitationPlan.isViable) {
    ctx.log('warn', 'Elicitation plan not viable - insufficient experts or unclear goals');
    return {
      success: false,
      reason: 'Elicitation not viable',
      recommendations: elicitationPlan.recommendations,
      metadata: {
        processId: 'domains/business/knowledge-management/expert-knowledge-elicitation',
        timestamp: startTime
      }
    };
  }

  // Breakpoint: Review elicitation plan
  await ctx.breakpoint({
    question: `Elicitation plan created for ${experts.length} experts covering ${elicitationPlan.knowledgeAreas.length} knowledge areas. Review plan?`,
    title: 'Elicitation Plan Review',
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
        expertsPlanned: experts.length,
        knowledgeAreas: elicitationPlan.knowledgeAreas.length,
        sessionsPlanned: elicitationPlan.plannedSessions.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: INTERVIEW PROTOCOL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing interview protocols and guides');
  const interviewProtocol = await ctx.task(interviewProtocolTask, {
    knowledgeDomain,
    knowledgeAreas: elicitationPlan.knowledgeAreas,
    elicitationMethods,
    experts,
    outputDir
  });

  artifacts.push(...interviewProtocol.artifacts);

  // ============================================================================
  // PHASE 3: ELICITATION SESSION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Executing knowledge elicitation sessions');
  const elicitationSessions = await ctx.task(elicitationExecutionTask, {
    knowledgeDomain,
    experts,
    interviewProtocol,
    plannedSessions: elicitationPlan.plannedSessions,
    elicitationMethods,
    outputDir
  });

  artifacts.push(...elicitationSessions.artifacts);

  // Breakpoint: Review elicitation sessions
  await ctx.breakpoint({
    question: `Completed ${elicitationSessions.completedSessions.length} elicitation sessions. Review session outcomes?`,
    title: 'Elicitation Sessions Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        sessionsCompleted: elicitationSessions.completedSessions.length,
        knowledgeItemsCaptured: elicitationSessions.knowledgeItems.length,
        expertsInterviewed: elicitationSessions.expertsInterviewed
      }
    }
  });

  // ============================================================================
  // PHASE 4: KNOWLEDGE EXTRACTION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Extracting and analyzing captured knowledge');
  const knowledgeExtraction = await ctx.task(knowledgeExtractionTask, {
    knowledgeDomain,
    sessionData: elicitationSessions.completedSessions,
    knowledgeItems: elicitationSessions.knowledgeItems,
    existingKnowledge,
    outputDir
  });

  artifacts.push(...knowledgeExtraction.artifacts);

  // ============================================================================
  // PHASE 5: KNOWLEDGE STRUCTURING AND ORGANIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Structuring and organizing extracted knowledge');
  const knowledgeStructuring = await ctx.task(knowledgeStructuringTask, {
    knowledgeDomain,
    extractedKnowledge: knowledgeExtraction.extractedKnowledge,
    knowledgeAreas: elicitationPlan.knowledgeAreas,
    outputDir
  });

  artifacts.push(...knowledgeStructuring.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing knowledge documentation');
  const documentation = await ctx.task(documentationDevelopmentTask, {
    knowledgeDomain,
    structuredKnowledge: knowledgeStructuring.structuredKnowledge,
    experts,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Breakpoint: Review documentation
  await ctx.breakpoint({
    question: `Created ${documentation.documents.length} knowledge documents. Review documentation?`,
    title: 'Documentation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        documentsCreated: documentation.documents.length,
        documentTypes: documentation.documentTypes,
        totalKnowledgeItems: documentation.totalKnowledgeItems
      }
    }
  });

  // ============================================================================
  // PHASE 7: EXPERT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating captured knowledge with experts');
  const expertValidation = await ctx.task(expertValidationTask, {
    knowledgeDomain,
    documents: documentation.documents,
    experts,
    outputDir
  });

  artifacts.push(...expertValidation.artifacts);

  const validationPassed = expertValidation.overallScore >= 80;

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing overall elicitation quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    knowledgeDomain,
    elicitationPlan,
    elicitationSessions,
    knowledgeExtraction,
    documentation,
    expertValidation,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 9: KNOWLEDGE GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing knowledge gaps and follow-up needs');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    knowledgeDomain,
    elicitationGoals,
    capturedKnowledge: documentation.documents,
    knowledgeAreas: elicitationPlan.knowledgeAreas,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      knowledgeDomain,
      capturedKnowledge: documentation.documents,
      qualityScore: qualityAssessment.overallScore,
      expertValidation,
      gapAnalysis,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize elicitation?`,
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
          gapsIdentified: gapAnalysis.gaps.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    knowledgeDomain,
    capturedKnowledge: documentation.documents,
    elicitationSessions: elicitationSessions.completedSessions,
    statistics: {
      expertsInterviewed: elicitationSessions.expertsInterviewed,
      sessionsCompleted: elicitationSessions.completedSessions.length,
      knowledgeItemsCaptured: knowledgeExtraction.extractedKnowledge.length,
      documentsProduced: documentation.documents.length,
      knowledgeAreasConvered: elicitationPlan.knowledgeAreas.length
    },
    validation: {
      expertValidationScore: expertValidation.overallScore,
      validationPassed,
      expertsReviewed: expertValidation.expertsReviewed
    },
    qualityScore: qualityAssessment.overallScore,
    gapAnalysis: {
      gapsIdentified: gapAnalysis.gaps.length,
      followUpNeeded: gapAnalysis.followUpNeeded,
      recommendations: gapAnalysis.recommendations
    },
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/expert-knowledge-elicitation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Elicitation Planning
export const elicitationPlanningTask = defineTask('elicitation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan knowledge elicitation activities',
  agent: {
    name: 'knowledge-analyst',
    prompt: {
      role: 'knowledge management specialist planning expert elicitation',
      task: 'Develop comprehensive plan for expert knowledge elicitation',
      context: args,
      instructions: [
        'Analyze elicitation goals and requirements',
        'Profile subject matter experts and their knowledge domains',
        'Identify specific knowledge areas to be captured:',
        '  - Procedural knowledge (how-to)',
        '  - Conceptual knowledge (understanding)',
        '  - Contextual knowledge (when and why)',
        '  - Relational knowledge (connections)',
        'Select appropriate elicitation methods for each area',
        'Plan session schedule and logistics',
        'Define success criteria for elicitation',
        'Identify potential challenges and mitigations',
        'Create expert preparation materials',
        'Assess feasibility and viability',
        'Save elicitation plan to output directory'
      ],
      outputFormat: 'JSON with isViable (boolean), knowledgeAreas (array), plannedSessions (array), expertProfiles (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isViable', 'knowledgeAreas', 'plannedSessions', 'artifacts'],
      properties: {
        isViable: { type: 'boolean' },
        knowledgeAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              experts: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              elicitationMethods: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        plannedSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              expert: { type: 'string' },
              knowledgeArea: { type: 'string' },
              method: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        expertProfiles: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'elicitation', 'planning']
}));

// Task 2: Interview Protocol Development
export const interviewProtocolTask = defineTask('interview-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop interview protocols and guides',
  agent: {
    name: 'interview-designer',
    prompt: {
      role: 'knowledge elicitation specialist designing interview protocols',
      task: 'Create structured interview protocols for expert knowledge capture',
      context: args,
      instructions: [
        'Design structured interview protocols for each knowledge area',
        'Create question guides using elicitation techniques:',
        '  - Open-ended questions for exploration',
        '  - Probing questions for depth',
        '  - Scenario-based questions for context',
        '  - Critical incident technique questions',
        '  - Think-aloud protocols',
        'Design observation protocols and checklists',
        'Create concept mapping exercise guides',
        'Develop warm-up and rapport-building questions',
        'Include knowledge verification questions',
        'Design follow-up and clarification protocols',
        'Create session recording and note-taking templates',
        'Develop expert preparation materials',
        'Save interview protocols to output directory'
      ],
      outputFormat: 'JSON with protocols (array), questionGuides (array), observationChecklists (array), templates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'questionGuides', 'artifacts'],
      properties: {
        protocols: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              knowledgeArea: { type: 'string' },
              method: { type: 'string' },
              structure: { type: 'array' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        questionGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } },
              probes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        observationChecklists: { type: 'array' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'interview', 'protocol']
}));

// Task 3: Elicitation Execution
export const elicitationExecutionTask = defineTask('elicitation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute knowledge elicitation sessions',
  agent: {
    name: 'knowledge-facilitator',
    prompt: {
      role: 'knowledge facilitator conducting elicitation sessions',
      task: 'Document and synthesize knowledge elicitation session outcomes',
      context: args,
      instructions: [
        'Document elicitation session execution for each planned session',
        'For each session capture:',
        '  - Session metadata (expert, date, duration)',
        '  - Key knowledge items elicited',
        '  - Insights and observations',
        '  - Expert quotes and examples',
        '  - Challenges encountered',
        '  - Follow-up questions identified',
        'Synthesize knowledge items from all sessions',
        'Identify cross-expert patterns and themes',
        'Note areas of expert agreement and disagreement',
        'Track knowledge coverage against plan',
        'Document unexpected knowledge discoveries',
        'Create session summary reports',
        'Save session documentation to output directory'
      ],
      outputFormat: 'JSON with completedSessions (array), knowledgeItems (array), expertsInterviewed (number), themes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completedSessions', 'knowledgeItems', 'expertsInterviewed', 'artifacts'],
      properties: {
        completedSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              expert: { type: 'string' },
              knowledgeArea: { type: 'string' },
              method: { type: 'string' },
              duration: { type: 'string' },
              knowledgeItemsCount: { type: 'number' },
              keyInsights: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        knowledgeItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              area: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' },
              source: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        expertsInterviewed: { type: 'number' },
        themes: { type: 'array', items: { type: 'string' } },
        followUpNeeded: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'elicitation', 'execution']
}));

// Task 4: Knowledge Extraction
export const knowledgeExtractionTask = defineTask('knowledge-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract and analyze captured knowledge',
  agent: {
    name: 'knowledge-engineer',
    prompt: {
      role: 'knowledge engineer analyzing elicitation outputs',
      task: 'Extract, categorize, and analyze captured knowledge',
      context: args,
      instructions: [
        'Analyze all captured knowledge items',
        'Extract distinct knowledge elements:',
        '  - Procedures and processes',
        '  - Decision rules and heuristics',
        '  - Concepts and definitions',
        '  - Relationships and dependencies',
        '  - Context and conditions',
        '  - Exceptions and edge cases',
        'Categorize knowledge by type and domain',
        'Identify knowledge relationships and dependencies',
        'Map knowledge to existing organizational knowledge',
        'Identify novel versus existing knowledge',
        'Assess knowledge completeness and depth',
        'Flag ambiguous or contradictory knowledge',
        'Prioritize knowledge for documentation',
        'Save extracted knowledge to output directory'
      ],
      outputFormat: 'JSON with extractedKnowledge (array), knowledgeGraph (object), novelKnowledge (array), ambiguities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['extractedKnowledge', 'artifacts'],
      properties: {
        extractedKnowledge: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string' },
              content: { type: 'string' },
              sources: { type: 'array', items: { type: 'string' } },
              relationships: { type: 'array' },
              completeness: { type: 'string', enum: ['complete', 'partial', 'incomplete'] }
            }
          }
        },
        knowledgeGraph: { type: 'object' },
        novelKnowledge: { type: 'array', items: { type: 'string' } },
        ambiguities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'extraction', 'analysis']
}));

// Task 5: Knowledge Structuring
export const knowledgeStructuringTask = defineTask('knowledge-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure and organize extracted knowledge',
  agent: {
    name: 'knowledge-architect',
    prompt: {
      role: 'knowledge architect organizing knowledge structures',
      task: 'Structure and organize extracted knowledge for documentation',
      context: args,
      instructions: [
        'Design knowledge structure and organization:',
        '  - Hierarchical groupings',
        '  - Topic clusters',
        '  - Process flows',
        '  - Decision trees',
        'Create logical relationships between elements',
        'Establish navigation and discovery paths',
        'Apply consistent taxonomy and tagging',
        'Define knowledge asset boundaries',
        'Create knowledge maps and visualizations',
        'Establish cross-references and links',
        'Define document structures for each type',
        'Ensure completeness of structures',
        'Save structured knowledge to output directory'
      ],
      outputFormat: 'JSON with structuredKnowledge (array), taxonomy (object), knowledgeMaps (array), documentStructures (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structuredKnowledge', 'artifacts'],
      properties: {
        structuredKnowledge: { type: 'array' },
        taxonomy: { type: 'object' },
        knowledgeMaps: { type: 'array' },
        documentStructures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'structuring', 'organization']
}));

// Task 6: Documentation Development
export const documentationDevelopmentTask = defineTask('documentation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop knowledge documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer creating knowledge documentation',
      task: 'Create comprehensive documentation from structured knowledge',
      context: args,
      instructions: [
        'Create documentation for all structured knowledge:',
        '  - Procedures and how-to guides',
        '  - Reference documents',
        '  - Decision guides',
        '  - Best practices',
        '  - Case studies',
        'Apply appropriate formats for each type',
        'Include rich examples and illustrations',
        'Add context and background information',
        'Include expert attribution and sources',
        'Create navigation aids and indexes',
        'Apply consistent formatting and style',
        'Include metadata for discovery',
        'Create summary and overview documents',
        'Save documentation to output directory'
      ],
      outputFormat: 'JSON with documents (array), documentTypes (object), totalKnowledgeItems (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'documentTypes', 'artifacts'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              knowledgeArea: { type: 'string' },
              expertSources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        documentTypes: { type: 'object' },
        totalKnowledgeItems: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'documentation', 'writing']
}));

// Task 7: Expert Validation
export const expertValidationTask = defineTask('expert-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate captured knowledge with experts',
  agent: {
    name: 'validation-coordinator',
    prompt: {
      role: 'validation coordinator facilitating expert review',
      task: 'Coordinate expert validation of captured knowledge documentation',
      context: args,
      instructions: [
        'Design validation process for expert review',
        'Assign documents to appropriate expert reviewers',
        'Define validation criteria:',
        '  - Accuracy and correctness',
        '  - Completeness',
        '  - Clarity and understandability',
        '  - Practical applicability',
        'Collect expert feedback and scores',
        'Document corrections and enhancements',
        'Calculate validation scores per document and overall',
        'Identify areas requiring revision',
        'Document expert sign-offs',
        'Create validation report',
        'Save validation results to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), expertsReviewed (number), validationResults (array), corrections (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'expertsReviewed', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        expertsReviewed: { type: 'number' },
        validationResults: { type: 'array' },
        corrections: { type: 'array' },
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
  title: 'Assess overall elicitation quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'knowledge quality assessor',
      task: 'Evaluate the overall quality of the knowledge elicitation process',
      context: args,
      instructions: [
        'Assess elicitation process quality:',
        '  - Planning effectiveness',
        '  - Session execution quality',
        '  - Knowledge extraction completeness',
        '  - Documentation quality',
        'Evaluate captured knowledge quality:',
        '  - Accuracy and validity',
        '  - Depth and completeness',
        '  - Practical utility',
        '  - Expert validation scores',
        'Calculate weighted overall quality score',
        'Identify strengths and improvement areas',
        'Compare against best practices',
        'Provide recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), processQuality (object), knowledgeQuality (object), strengths (array), improvements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        processQuality: { type: 'object' },
        knowledgeQuality: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 9: Gap Analysis
export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge gaps and follow-up needs',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'knowledge analyst identifying gaps and follow-up needs',
      task: 'Identify remaining knowledge gaps and recommend follow-up',
      context: args,
      instructions: [
        'Compare captured knowledge against elicitation goals',
        'Identify knowledge gaps:',
        '  - Uncovered knowledge areas',
        '  - Incomplete knowledge items',
        '  - Unresolved ambiguities',
        '  - Missing context or conditions',
        'Prioritize gaps by importance and impact',
        'Identify additional experts or sources needed',
        'Recommend follow-up elicitation activities',
        'Estimate effort for gap closure',
        'Create gap remediation plan',
        'Save gap analysis to output directory'
      ],
      outputFormat: 'JSON with gaps (array), followUpNeeded (boolean), recommendations (array), remediationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'followUpNeeded', 'recommendations', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gapDescription: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediationApproach: { type: 'string' }
            }
          }
        },
        followUpNeeded: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        remediationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'gap-analysis']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of elicitation results',
      context: args,
      instructions: [
        'Present elicitation results to stakeholders',
        'Review captured knowledge and documentation',
        'Present quality assessment and validation results',
        'Discuss knowledge gaps and follow-up plans',
        'Gather stakeholder feedback',
        'Address concerns and questions',
        'Obtain approval or identify required changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
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
