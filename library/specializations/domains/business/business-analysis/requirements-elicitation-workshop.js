/**
 * @process business-analysis/requirements-elicitation-workshop
 * @description Facilitate structured stakeholder workshops to elicit business and functional requirements using techniques including interviews, brainstorming, prototyping, and document analysis. Produces prioritized requirements aligned with business objectives.
 * @inputs { projectName: string, stakeholders: array, businessContext: object, objectives: array, existingDocuments: array }
 * @outputs { success: boolean, requirementsCatalog: object, workshopAgenda: object, stakeholderSignoff: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    stakeholders = [],
    businessContext = {},
    objectives = [],
    existingDocuments = [],
    outputDir = 'requirements-workshop-output',
    elicitationTechniques = ['interviews', 'brainstorming', 'prototyping', 'document-analysis']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Requirements Elicitation Workshop for ${projectName}`);

  // ============================================================================
  // PHASE 1: WORKSHOP PREPARATION AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing workshop and stakeholder analysis');
  const workshopPreparation = await ctx.task(workshopPreparationTask, {
    projectName,
    stakeholders,
    businessContext,
    objectives,
    existingDocuments,
    outputDir
  });

  artifacts.push(...workshopPreparation.artifacts);

  // ============================================================================
  // PHASE 2: STAKEHOLDER INTERVIEW PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Planning stakeholder interviews');
  const interviewPlanning = await ctx.task(interviewPlanningTask, {
    projectName,
    stakeholders,
    workshopPreparation,
    businessContext,
    outputDir
  });

  artifacts.push(...interviewPlanning.artifacts);

  // ============================================================================
  // PHASE 3: DOCUMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing existing documentation');
  const documentAnalysis = await ctx.task(documentAnalysisTask, {
    projectName,
    existingDocuments,
    businessContext,
    objectives,
    outputDir
  });

  artifacts.push(...documentAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: BRAINSTORMING SESSION FACILITATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Facilitating brainstorming sessions');
  const brainstormingSession = await ctx.task(brainstormingSessionTask, {
    projectName,
    stakeholders,
    workshopPreparation,
    documentAnalysis,
    objectives,
    outputDir
  });

  artifacts.push(...brainstormingSession.artifacts);

  // ============================================================================
  // PHASE 5: REQUIREMENTS CONSOLIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Consolidating elicited requirements');
  const requirementsConsolidation = await ctx.task(requirementsConsolidationTask, {
    projectName,
    interviewPlanning,
    documentAnalysis,
    brainstormingSession,
    businessContext,
    objectives,
    outputDir
  });

  artifacts.push(...requirementsConsolidation.artifacts);

  // ============================================================================
  // PHASE 6: REQUIREMENTS PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing requirements with stakeholders');
  const requirementsPrioritization = await ctx.task(requirementsPrioritizationTask, {
    projectName,
    consolidatedRequirements: requirementsConsolidation.requirements,
    stakeholders,
    businessContext,
    objectives,
    outputDir
  });

  artifacts.push(...requirementsPrioritization.artifacts);

  // ============================================================================
  // PHASE 7: WORKSHOP AGENDA GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating comprehensive workshop agenda');
  const workshopAgenda = await ctx.task(workshopAgendaGenerationTask, {
    projectName,
    workshopPreparation,
    interviewPlanning,
    brainstormingSession,
    stakeholders,
    outputDir
  });

  artifacts.push(...workshopAgenda.artifacts);

  // ============================================================================
  // PHASE 8: REQUIREMENTS CATALOG CREATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating requirements catalog');
  const requirementsCatalog = await ctx.task(requirementsCatalogCreationTask, {
    projectName,
    prioritizedRequirements: requirementsPrioritization.prioritizedRequirements,
    stakeholders,
    businessContext,
    objectives,
    outputDir
  });

  artifacts.push(...requirementsCatalog.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Scoring requirements quality and completeness');
  const qualityScore = await ctx.task(requirementsQualityScoringTask, {
    projectName,
    requirementsCatalog,
    stakeholders,
    objectives,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 80;

  // Breakpoint: Review requirements catalog
  await ctx.breakpoint({
    question: `Requirements elicitation complete for ${projectName}. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Additional elicitation may be needed.'} Review and approve?`,
    title: 'Requirements Elicitation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        qualityScore: qualityScore.overallScore,
        qualityMet,
        totalRequirements: requirementsCatalog.totalRequirements,
        prioritizedRequirements: requirementsPrioritization.prioritizedRequirements?.length || 0,
        stakeholdersInvolved: stakeholders.length
      }
    }
  });

  // ============================================================================
  // PHASE 10: STAKEHOLDER SIGN-OFF PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Preparing stakeholder sign-off documentation');
  const stakeholderSignoff = await ctx.task(stakeholderSignoffTask, {
    projectName,
    requirementsCatalog,
    qualityScore,
    stakeholders,
    outputDir
  });

  artifacts.push(...stakeholderSignoff.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: qualityScore.overallScore,
    qualityMet,
    workshopAgenda: workshopAgenda.agenda,
    requirementsCatalog: {
      totalRequirements: requirementsCatalog.totalRequirements,
      functionalRequirements: requirementsCatalog.functionalRequirements,
      nonFunctionalRequirements: requirementsCatalog.nonFunctionalRequirements,
      prioritization: requirementsPrioritization.prioritizedRequirements
    },
    stakeholderSignoff: {
      readyForSignoff: stakeholderSignoff.readyForSignoff,
      pendingApprovals: stakeholderSignoff.pendingApprovals,
      signoffDocument: stakeholderSignoff.signoffDocumentPath
    },
    elicitationSummary: {
      techniquesUsed: elicitationTechniques,
      documentsAnalyzed: documentAnalysis.documentsAnalyzed,
      brainstormingIdeas: brainstormingSession.totalIdeas
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/requirements-elicitation-workshop',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const workshopPreparationTask = defineTask('workshop-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare requirements elicitation workshop',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst and workshop facilitator certified in BABOK',
      task: 'Prepare comprehensive requirements elicitation workshop including stakeholder analysis and logistics planning',
      context: args,
      instructions: [
        'Analyze stakeholder list and identify key decision-makers, subject matter experts, and end users',
        'Create stakeholder influence/interest matrix for prioritizing engagement',
        'Review business context and objectives to define workshop scope',
        'Identify pre-workshop information gathering needs',
        'Define workshop objectives and success criteria',
        'Plan workshop logistics (duration, format, tools, facilities)',
        'Create stakeholder communication plan for workshop invitations',
        'Identify potential risks and mitigation strategies for workshop',
        'Prepare pre-reading materials and context documents for participants',
        'Define roles and responsibilities for workshop facilitation'
      ],
      outputFormat: 'JSON with workshopPlan, stakeholderAnalysis, logistics, communicationPlan, preReadingMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workshopPlan', 'stakeholderAnalysis', 'logistics', 'artifacts'],
      properties: {
        workshopPlan: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            scope: { type: 'string' },
            successCriteria: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            format: { type: 'string' }
          }
        },
        stakeholderAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              role: { type: 'string' },
              influence: { type: 'string', enum: ['high', 'medium', 'low'] },
              interest: { type: 'string', enum: ['high', 'medium', 'low'] },
              engagementStrategy: { type: 'string' }
            }
          }
        },
        logistics: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            format: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            facilities: { type: 'string' }
          }
        },
        communicationPlan: { type: 'object' },
        preReadingMaterials: { type: 'array', items: { type: 'string' } },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
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
  labels: ['agent', 'business-analysis', 'workshop-preparation', 'babok']
}));

export const interviewPlanningTask = defineTask('interview-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan stakeholder interviews',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with expertise in stakeholder interviews',
      task: 'Plan structured stakeholder interviews for requirements elicitation',
      context: args,
      instructions: [
        'Identify interview candidates based on stakeholder analysis',
        'Define interview objectives for each stakeholder group',
        'Create interview guides with open-ended and probing questions',
        'Plan interview logistics (duration, format, recording)',
        'Develop techniques for handling difficult stakeholders',
        'Create interview summary templates',
        'Plan follow-up mechanisms for clarification',
        'Define how interview findings will be validated',
        'Prepare consent and confidentiality documentation if needed',
        'Schedule interviews with consideration for stakeholder availability'
      ],
      outputFormat: 'JSON with interviewPlan, interviewGuides, schedulingPlan, summaryTemplates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewPlan', 'interviewGuides', 'artifacts'],
      properties: {
        interviewPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              format: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        interviewGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } },
              probingQuestions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        schedulingPlan: { type: 'object' },
        summaryTemplates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'interview-planning', 'elicitation']
}));

export const documentAnalysisTask = defineTask('document-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze existing documentation',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with document analysis expertise',
      task: 'Analyze existing documentation to extract implicit and explicit requirements',
      context: args,
      instructions: [
        'Catalog all existing documents relevant to the project',
        'Analyze business process documentation for implicit requirements',
        'Review system documentation for technical constraints',
        'Extract requirements from existing user manuals and training materials',
        'Identify gaps in documentation coverage',
        'Cross-reference documents to identify inconsistencies',
        'Extract business rules from policy and procedure documents',
        'Identify regulatory and compliance requirements from relevant documents',
        'Document assumptions found in existing materials',
        'Create document analysis summary with key findings'
      ],
      outputFormat: 'JSON with documentsAnalyzed, extractedRequirements, gaps, inconsistencies, businessRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentsAnalyzed', 'extractedRequirements', 'gaps', 'artifacts'],
      properties: {
        documentsAnalyzed: { type: 'number' },
        documentCatalog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              documentName: { type: 'string' },
              type: { type: 'string' },
              relevance: { type: 'string', enum: ['high', 'medium', 'low'] },
              keyFindings: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        extractedRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              source: { type: 'string' },
              type: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        inconsistencies: { type: 'array', items: { type: 'string' } },
        businessRules: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'document-analysis', 'elicitation']
}));

export const brainstormingSessionTask = defineTask('brainstorming-session', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Facilitate brainstorming sessions',
  agent: {
    name: 'workshop-facilitator',
    prompt: {
      role: 'expert workshop facilitator with brainstorming and ideation expertise',
      task: 'Facilitate brainstorming sessions to generate and capture stakeholder ideas',
      context: args,
      instructions: [
        'Design brainstorming session structure and ground rules',
        'Prepare ideation prompts based on objectives and document analysis',
        'Plan warm-up exercises to encourage participation',
        'Define techniques to use (brainwriting, round-robin, mind mapping)',
        'Create mechanisms for capturing and organizing ideas',
        'Plan convergence activities for grouping and prioritizing ideas',
        'Prepare facilitation scripts for each session segment',
        'Design voting/ranking mechanisms for idea prioritization',
        'Plan for remote/hybrid participation if applicable',
        'Create session output documentation templates'
      ],
      outputFormat: 'JSON with sessionPlan, ideationPrompts, capturedIdeas, totalIdeas, groupedIdeas, prioritizedIdeas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sessionPlan', 'totalIdeas', 'artifacts'],
      properties: {
        sessionPlan: {
          type: 'object',
          properties: {
            structure: { type: 'array', items: { type: 'string' } },
            groundRules: { type: 'array', items: { type: 'string' } },
            techniques: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' }
          }
        },
        ideationPrompts: { type: 'array', items: { type: 'string' } },
        totalIdeas: { type: 'number' },
        capturedIdeas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idea: { type: 'string' },
              category: { type: 'string' },
              contributor: { type: 'string' },
              votes: { type: 'number' }
            }
          }
        },
        groupedIdeas: { type: 'object' },
        prioritizedIdeas: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'brainstorming', 'facilitation']
}));

export const requirementsConsolidationTask = defineTask('requirements-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consolidate elicited requirements',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with requirements management expertise',
      task: 'Consolidate requirements from all elicitation sources into unified requirements set',
      context: args,
      instructions: [
        'Compile requirements from interviews, documents, and brainstorming',
        'Remove duplicate and overlapping requirements',
        'Identify conflicting requirements and document for resolution',
        'Categorize requirements (functional, non-functional, constraints)',
        'Apply INVEST criteria to assess requirement quality',
        'Identify dependencies between requirements',
        'Tag requirements with source and stakeholder attribution',
        'Create requirement IDs following naming conventions',
        'Document assumptions and open questions',
        'Prepare consolidated requirements for prioritization'
      ],
      outputFormat: 'JSON with requirements, duplicatesRemoved, conflicts, categories, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'conflicts', 'artifacts'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              source: { type: 'string' },
              stakeholder: { type: 'string' },
              investScore: { type: 'number' }
            }
          }
        },
        duplicatesRemoved: { type: 'number' },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement1: { type: 'string' },
              requirement2: { type: 'string' },
              conflictDescription: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        categories: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'requirements-consolidation', 'babok']
}));

export const requirementsPrioritizationTask = defineTask('requirements-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize requirements',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with prioritization expertise',
      task: 'Facilitate requirements prioritization using MoSCoW and value-based methods',
      context: args,
      instructions: [
        'Apply MoSCoW prioritization (Must have, Should have, Could have, Won\'t have)',
        'Assess business value for each requirement',
        'Evaluate implementation complexity and effort',
        'Consider dependencies in prioritization',
        'Identify regulatory and compliance driven priorities',
        'Apply risk-based prioritization for critical requirements',
        'Create prioritized backlog aligned with objectives',
        'Document prioritization rationale',
        'Identify quick wins (high value, low effort)',
        'Prepare prioritization summary for stakeholder review'
      ],
      outputFormat: 'JSON with prioritizedRequirements, moscowBreakdown, valueEffortMatrix, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRequirements', 'moscowBreakdown', 'artifacts'],
      properties: {
        prioritizedRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              moscow: { type: 'string', enum: ['must', 'should', 'could', 'wont'] },
              businessValue: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'number' }
            }
          }
        },
        moscowBreakdown: {
          type: 'object',
          properties: {
            must: { type: 'number' },
            should: { type: 'number' },
            could: { type: 'number' },
            wont: { type: 'number' }
          }
        },
        valueEffortMatrix: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'string' } },
        prioritizationRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'prioritization', 'moscow']
}));

export const workshopAgendaGenerationTask = defineTask('workshop-agenda-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate workshop agenda',
  agent: {
    name: 'workshop-facilitator',
    prompt: {
      role: 'expert workshop facilitator and business analyst',
      task: 'Generate comprehensive workshop agenda with detailed session plans',
      context: args,
      instructions: [
        'Create detailed workshop agenda with time allocations',
        'Include opening, context setting, and objective alignment',
        'Plan elicitation technique sessions (interviews, brainstorming)',
        'Include breaks and energizer activities',
        'Plan for requirements review and validation sessions',
        'Include prioritization activities',
        'Plan closing, next steps, and action items',
        'Create facilitator notes for each session',
        'Prepare participant materials list',
        'Include contingency plans for timing adjustments'
      ],
      outputFormat: 'JSON with agenda, sessionDetails, facilitatorNotes, participantMaterials, contingencyPlans, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'sessionDetails', 'artifacts'],
      properties: {
        agenda: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              session: { type: 'string' },
              duration: { type: 'string' },
              facilitator: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        sessionDetails: { type: 'array', items: { type: 'object' } },
        facilitatorNotes: { type: 'array', items: { type: 'string' } },
        participantMaterials: { type: 'array', items: { type: 'string' } },
        contingencyPlans: { type: 'array', items: { type: 'string' } },
        totalDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'workshop-agenda', 'facilitation']
}));

export const requirementsCatalogCreationTask = defineTask('requirements-catalog-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create requirements catalog',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with requirements documentation expertise',
      task: 'Create comprehensive requirements catalog following BABOK and Volere standards',
      context: args,
      instructions: [
        'Structure requirements catalog using Volere template format',
        'Document functional requirements with acceptance criteria',
        'Document non-functional requirements with measurable criteria',
        'Include requirement metadata (ID, source, priority, status)',
        'Create requirements traceability links to objectives',
        'Document business rules and constraints',
        'Include data requirements and interfaces',
        'Document assumptions and dependencies',
        'Create glossary of terms',
        'Generate requirements catalog document'
      ],
      outputFormat: 'JSON with totalRequirements, functionalRequirements, nonFunctionalRequirements, businessRules, traceability, glossary, catalogPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRequirements', 'functionalRequirements', 'nonFunctionalRequirements', 'artifacts'],
      properties: {
        totalRequirements: { type: 'number' },
        functionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        nonFunctionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              measurementCriteria: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        businessRules: { type: 'array', items: { type: 'object' } },
        traceability: { type: 'object' },
        glossary: { type: 'array', items: { type: 'object' } },
        catalogPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'requirements-catalog', 'volere']
}));

export const requirementsQualityScoringTask = defineTask('requirements-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score requirements quality',
  agent: {
    name: 'qa-analyst',
    prompt: {
      role: 'requirements quality assurance specialist',
      task: 'Assess requirements catalog quality and completeness against BABOK standards',
      context: args,
      instructions: [
        'Evaluate requirements completeness (all areas covered)',
        'Assess requirements clarity and unambiguity',
        'Check requirements testability and verifiability',
        'Evaluate consistency across requirements',
        'Assess traceability to business objectives',
        'Check for missing requirements using gap analysis',
        'Evaluate acceptance criteria quality',
        'Assess stakeholder coverage',
        'Calculate overall quality score (0-100)',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, readinessAssessment, artifacts'
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
            clarity: { type: 'number' },
            testability: { type: 'number' },
            consistency: { type: 'number' },
            traceability: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        readinessAssessment: { type: 'string', enum: ['ready', 'minor-improvements', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'quality-scoring', 'validation']
}));

export const stakeholderSignoffTask = defineTask('stakeholder-signoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare stakeholder sign-off',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with stakeholder management expertise',
      task: 'Prepare stakeholder sign-off documentation and approval workflow',
      context: args,
      instructions: [
        'Create sign-off document summarizing key requirements',
        'Define approval workflow and sign-off authorities',
        'Prepare executive summary for stakeholder review',
        'Document scope agreements and exclusions',
        'Create sign-off checklist for each stakeholder',
        'Prepare change control process for post-sign-off changes',
        'Document acceptance criteria for sign-off',
        'Create stakeholder notification plan',
        'Prepare sign-off meeting agenda if needed',
        'Document next steps after sign-off'
      ],
      outputFormat: 'JSON with readyForSignoff, signoffDocumentPath, approvalWorkflow, pendingApprovals, changeControlProcess, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readyForSignoff', 'signoffDocumentPath', 'pendingApprovals', 'artifacts'],
      properties: {
        readyForSignoff: { type: 'boolean' },
        signoffDocumentPath: { type: 'string' },
        approvalWorkflow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              role: { type: 'string' },
              approvalType: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'approved', 'rejected'] }
            }
          }
        },
        pendingApprovals: { type: 'array', items: { type: 'string' } },
        changeControlProcess: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'signoff', 'stakeholder-management']
}));
