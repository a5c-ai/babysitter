/**
 * @process software-architecture/adr-documentation
 * @description Architecture Decision Records (ADRs) lifecycle management process with decision analysis, template generation, review workflow, and ADR repository maintenance
 * @inputs { decision: string, context: object, stakeholders: array, adrNumber: number, outputDir: string, relatedAdrs: array }
 * @outputs { success: boolean, adrDocument: string, adrNumber: number, status: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    decision = '',
    context = {},
    stakeholders = [],
    adrNumber = null,
    outputDir = 'adr-output',
    relatedAdrs = [],
    template = 'nygard', // nygard, madr, or custom
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting ADR Documentation Process');

  // ============================================================================
  // PHASE 1: IDENTIFY DECISION NEED AND SCOPE
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying decision need and scope');
  const decisionAnalysis = await ctx.task(decisionAnalysisTask, {
    decision,
    context,
    stakeholders,
    outputDir
  });

  artifacts.push(...decisionAnalysis.artifacts);

  if (!decisionAnalysis.warrantsAdr) {
    ctx.log('warn', 'Decision does not warrant ADR - recommend alternative documentation');
    return {
      success: false,
      reason: 'Decision does not warrant ADR',
      recommendation: decisionAnalysis.recommendation,
      alternativeDocumentation: decisionAnalysis.alternativeDocumentation,
      metadata: {
        processId: 'software-architecture/adr-documentation',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: RESEARCH ALTERNATIVES
  // ============================================================================

  ctx.log('info', 'Phase 2: Researching decision alternatives');
  const alternativesResearch = await ctx.task(alternativesResearchTask, {
    decision: decisionAnalysis.refinedDecision,
    context,
    constraints: context.constraints || {},
    requirements: context.requirements || {},
    outputDir
  });

  artifacts.push(...alternativesResearch.artifacts);

  // ============================================================================
  // PHASE 3: ASSIGN ADR NUMBER
  // ============================================================================

  ctx.log('info', 'Phase 3: Assigning ADR number');
  const adrNumbering = await ctx.task(adrNumberingTask, {
    proposedNumber: adrNumber,
    outputDir,
    decision: decisionAnalysis.refinedDecision
  });

  const assignedAdrNumber = adrNumbering.adrNumber;
  artifacts.push(...adrNumbering.artifacts);

  // ============================================================================
  // PHASE 4: DRAFT ADR DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Drafting ADR document');
  const adrDraft = await ctx.task(adrDraftingTask, {
    adrNumber: assignedAdrNumber,
    decision: decisionAnalysis.refinedDecision,
    context,
    alternatives: alternativesResearch.alternatives,
    chosenOption: alternativesResearch.recommendedOption,
    consequences: alternativesResearch.consequences,
    relatedAdrs,
    template,
    outputDir
  });

  artifacts.push(...adrDraft.artifacts);

  // ============================================================================
  // PHASE 5: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating ADR quality');
  const qualityScore = await ctx.task(adrQualityScoringTask, {
    adrNumber: assignedAdrNumber,
    adrDocument: adrDraft.adrDocument,
    decision: decisionAnalysis.refinedDecision,
    alternatives: alternativesResearch.alternatives,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 80;

  // Breakpoint: Review draft ADR
  await ctx.breakpoint({
    question: `ADR ${assignedAdrNumber} draft complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review draft?`,
    title: 'ADR Draft Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        adrNumber: assignedAdrNumber,
        decision: decisionAnalysis.refinedDecision,
        qualityScore: qualityScore.overallScore,
        qualityMet,
        alternativesConsidered: alternativesResearch.alternatives.length,
        consequencesDocumented: alternativesResearch.consequences.positive.length + alternativesResearch.consequences.negative.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: REVIEW AND APPROVAL
  // ============================================================================

  let approvedAdr = adrDraft;
  let reviewResult = null;

  if (requireApproval) {
    ctx.log('info', 'Phase 6: Conducting review and approval');
    reviewResult = await ctx.task(adrReviewTask, {
      adrNumber: assignedAdrNumber,
      adrDocument: adrDraft.adrDocument,
      stakeholders,
      qualityScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Approval gate
    await ctx.breakpoint({
      question: `ADR ${assignedAdrNumber} review complete. ${reviewResult.approved ? 'Approved by reviewers!' : 'Requires revisions.'} Proceed with publication?`,
      title: 'ADR Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          adrNumber: assignedAdrNumber,
          approved: reviewResult.approved,
          reviewersCount: reviewResult.reviewers.length,
          feedbackItems: reviewResult.feedback.length,
          revisionsNeeded: reviewResult.revisionsNeeded
        }
      }
    });

    // If revisions needed, incorporate feedback
    if (reviewResult.revisionsNeeded && reviewResult.approved) {
      ctx.log('info', 'Incorporating review feedback');
      const revision = await ctx.task(adrRevisionTask, {
        adrNumber: assignedAdrNumber,
        adrDocument: adrDraft.adrDocument,
        feedback: reviewResult.feedback,
        outputDir
      });
      approvedAdr = revision;
      artifacts.push(...revision.artifacts);
    }
  }

  // ============================================================================
  // PHASE 7: PUBLISH ADR
  // ============================================================================

  ctx.log('info', 'Phase 7: Publishing ADR');
  const publishResult = await ctx.task(adrPublishingTask, {
    adrNumber: assignedAdrNumber,
    adrDocument: approvedAdr.adrDocument,
    relatedAdrs,
    outputDir
  });

  artifacts.push(...publishResult.artifacts);

  // ============================================================================
  // PHASE 8: UPDATE ADR INDEX AND LINKS
  // ============================================================================

  ctx.log('info', 'Phase 8: Updating ADR index and related links');
  const indexUpdate = await ctx.task(adrIndexUpdateTask, {
    adrNumber: assignedAdrNumber,
    decision: decisionAnalysis.refinedDecision,
    status: 'Accepted',
    relatedAdrs,
    tags: context.tags || [],
    outputDir
  });

  artifacts.push(...indexUpdate.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    adrNumber: assignedAdrNumber,
    decision: decisionAnalysis.refinedDecision,
    status: 'Accepted',
    adrDocument: publishResult.publishedPath,
    qualityScore: qualityScore.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    alternatives: {
      total: alternativesResearch.alternatives.length,
      chosen: alternativesResearch.recommendedOption
    },
    consequences: {
      positive: alternativesResearch.consequences.positive.length,
      negative: alternativesResearch.consequences.negative.length,
      neutral: alternativesResearch.consequences.neutral.length
    },
    relatedAdrs: relatedAdrs.length,
    artifacts,
    duration,
    metadata: {
      processId: 'software-architecture/adr-documentation',
      timestamp: startTime,
      outputDir,
      template
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Decision Analysis
export const decisionAnalysisTask = defineTask('decision-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze decision need and scope',
  agent: {
    name: 'architecture-analyst',
    prompt: {
      role: 'senior software architect and decision analyst',
      task: 'Analyze whether the decision warrants an ADR and refine decision scope',
      context: args,
      instructions: [
        'Evaluate if decision is architecturally significant (affects structure, NFRs, dependencies, interfaces)',
        'ADR warranted if: affects multiple teams, has long-term impact, involves trade-offs, difficult to reverse',
        'NOT warranted if: trivial implementation detail, temporary fix, code-level refactoring, personal preference',
        'If not warranted, recommend alternative documentation (code comment, wiki page, spike)',
        'If warranted, refine decision statement to be clear and specific',
        'Identify key stakeholders who should be involved',
        'Define decision scope and boundaries',
        'Document triggering context (why now?)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with warrantsAdr (boolean), refinedDecision (string), scope (object), stakeholders (array), recommendation (string), alternativeDocumentation (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['warrantsAdr', 'artifacts'],
      properties: {
        warrantsAdr: { type: 'boolean' },
        refinedDecision: { type: 'string' },
        scope: {
          type: 'object',
          properties: {
            affectedComponents: { type: 'array', items: { type: 'string' } },
            affectedTeams: { type: 'array', items: { type: 'string' } },
            impactLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            reversibility: { type: 'string', enum: ['easy', 'moderate', 'difficult', 'irreversible'] }
          }
        },
        stakeholders: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        alternativeDocumentation: { type: 'string' },
        triggeringContext: { type: 'string' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['agent', 'adr', 'decision-analysis']
}));

// Task 2: Alternatives Research
export const alternativesResearchTask = defineTask('alternatives-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research and analyze decision alternatives',
  agent: {
    name: 'solutions-architect',
    prompt: {
      role: 'solutions architect and technology researcher',
      task: 'Research viable alternatives for the decision and analyze pros/cons',
      context: args,
      instructions: [
        'Identify minimum 2-3 viable alternatives (including "do nothing" if applicable)',
        'For each alternative, research:',
        '  - Description and implementation approach',
        '  - Pros (benefits, strengths)',
        '  - Cons (drawbacks, limitations)',
        '  - Technical feasibility',
        '  - Effort estimate',
        '  - Risk assessment',
        'Consider prototyping or spiking if significant uncertainty',
        'Evaluate against requirements and constraints',
        'Recommend option with justification',
        'Document positive, negative, and neutral consequences of chosen option',
        'Save alternatives analysis to output directory'
      ],
      outputFormat: 'JSON with alternatives (array), recommendedOption (string), justification (string), consequences (object with positive, negative, neutral arrays), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'recommendedOption', 'consequences', 'artifacts'],
      properties: {
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string' },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        recommendedOption: { type: 'string' },
        justification: { type: 'string' },
        consequences: {
          type: 'object',
          properties: {
            positive: { type: 'array', items: { type: 'string' } },
            negative: { type: 'array', items: { type: 'string' } },
            neutral: { type: 'array', items: { type: 'string' } }
          }
        },
        tradeOffs: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'alternatives-research']
}));

// Task 3: ADR Numbering
export const adrNumberingTask = defineTask('adr-numbering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign sequential ADR number',
  agent: {
    name: 'adr-manager',
    prompt: {
      role: 'ADR repository manager',
      task: 'Assign next sequential ADR number',
      context: args,
      instructions: [
        'Check existing ADR repository for highest number',
        'If proposedNumber provided, validate it is available',
        'Assign next sequential number (e.g., if last is 0015, assign 0016)',
        'Use 4-digit zero-padded format (0001, 0002, etc.)',
        'Create ADR filename: ADR-{number}-{slug}.md',
        'Generate slug from decision title (lowercase, hyphens, max 50 chars)',
        'Document number assignment in ADR index',
        'Save numbering info to output directory'
      ],
      outputFormat: 'JSON with adrNumber (string like "0016"), filename (string), slug (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrNumber', 'filename', 'slug', 'artifacts'],
      properties: {
        adrNumber: { type: 'string', pattern: '^[0-9]{4}$' },
        filename: { type: 'string' },
        slug: { type: 'string' },
        previousHighest: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'numbering']
}));

// Task 4: ADR Drafting
export const adrDraftingTask = defineTask('adr-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft ADR document',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and software architect',
      task: 'Draft comprehensive ADR document using specified template',
      context: args,
      instructions: [
        'Use Nygard ADR template format (or specified template):',
        '  # ADR {number}: {Title}',
        '  ',
        '  ## Status',
        '  Proposed / Accepted / Deprecated / Superseded',
        '  ',
        '  ## Context',
        '  Describe the forces at play (technical, political, social, project)',
        '  Include triggering event, business drivers, constraints',
        '  Explain why decision is needed now',
        '  ',
        '  ## Decision',
        '  State the decision clearly and completely',
        '  Use active voice: "We will..."',
        '  ',
        '  ## Consequences',
        '  Document positive, negative, and neutral consequences',
        '  Be honest about trade-offs and risks',
        '  Include implementation effort and timeline',
        '  ',
        '  ## Alternatives Considered (optional section)',
        '  List alternatives evaluated and why rejected',
        '  ',
        '  ## Related Decisions',
        '  Link to related ADRs (supersedes, superseded by, related to)',
        'Keep ADR concise (1-2 pages target)',
        'Write for future readers who lack current context',
        'Use clear, jargon-free language where possible',
        'Set initial status to "Proposed"',
        'Save ADR document to output directory'
      ],
      outputFormat: 'JSON with adrDocument (string - full markdown content), metadata (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrDocument', 'metadata', 'artifacts'],
      properties: {
        adrDocument: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            number: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string' },
            date: { type: 'string' },
            deciders: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        wordCount: { type: 'number' },
        estimatedReadTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'drafting', 'documentation']
}));

// Task 5: ADR Quality Scoring
export const adrQualityScoringTask = defineTask('adr-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score ADR quality and completeness',
  agent: {
    name: 'adr-validator',
    prompt: {
      role: 'principal architect and ADR quality auditor',
      task: 'Assess ADR quality, completeness, and adherence to best practices',
      context: args,
      instructions: [
        'Evaluate Context section clarity and completeness (weight: 25%)',
        '  - Are forces at play clearly explained?',
        '  - Is triggering context documented?',
        '  - Are constraints identified?',
        'Evaluate Decision section clarity (weight: 25%)',
        '  - Is decision stated clearly and unambiguously?',
        '  - Can it be implemented based on this description?',
        'Evaluate Consequences documentation (weight: 25%)',
        '  - Are both positive and negative consequences listed?',
        '  - Are trade-offs explicitly stated?',
        '  - Is implementation effort estimated?',
        'Evaluate Alternatives consideration (weight: 15%)',
        '  - Were multiple alternatives researched?',
        '  - Are alternatives documented?',
        'Evaluate overall ADR quality (weight: 10%)',
        '  - Is writing clear and concise?',
        '  - Is ADR appropriately scoped (not too broad/narrow)?',
        '  - Are related ADRs linked?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific improvement recommendations',
        'Assess readiness for review'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), reviewReadiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            contextClarity: { type: 'number' },
            decisionClarity: { type: 'number' },
            consequencesCompleteness: { type: 'number' },
            alternativesDocumented: { type: 'number' },
            overallQuality: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            hasContext: { type: 'boolean' },
            hasDecision: { type: 'boolean' },
            hasConsequences: { type: 'boolean' },
            hasAlternatives: { type: 'boolean' },
            hasRelatedLinks: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        reviewReadiness: { type: 'string', enum: ['ready', 'minor-improvements', 'major-revisions'] },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'quality-scoring', 'validation']
}));

// Task 6: ADR Review
export const adrReviewTask = defineTask('adr-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct ADR review and approval',
  agent: {
    name: 'architecture-review-board',
    prompt: {
      role: 'architecture review board facilitator',
      task: 'Facilitate ADR review meeting and gather approval',
      context: args,
      instructions: [
        'Simulate review meeting with stakeholders',
        'Review ADR completeness and quality',
        'Evaluate technical soundness of decision',
        'Assess alignment with architectural principles',
        'Check for unintended consequences',
        'Gather feedback from reviewers',
        'Document concerns and suggestions',
        'Determine if revisions needed',
        'Recommend approval or rejection',
        'If approved with minor feedback, list revision items',
        'Document review outcome and next steps'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), revisionsNeeded (boolean), revisionItems (array), concerns (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'major', 'blocker'] }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        revisionItems: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'review', 'approval']
}));

// Task 7: ADR Revision
export const adrRevisionTask = defineTask('adr-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Incorporate review feedback',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer',
      task: 'Revise ADR document based on review feedback',
      context: args,
      instructions: [
        'Review all feedback items',
        'Address major and blocker issues',
        'Incorporate minor suggestions where appropriate',
        'Maintain ADR structure and format',
        'Update affected sections (Context, Decision, Consequences)',
        'Add clarifications and missing details',
        'Document what changed and why',
        'Save revised ADR to output directory'
      ],
      outputFormat: 'JSON with adrDocument (string - revised markdown), changesApplied (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrDocument', 'changesApplied', 'artifacts'],
      properties: {
        adrDocument: { type: 'string' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['agent', 'adr', 'revision']
}));

// Task 8: ADR Publishing
export const adrPublishingTask = defineTask('adr-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish ADR to repository',
  agent: {
    name: 'adr-publisher',
    prompt: {
      role: 'ADR repository manager',
      task: 'Publish ADR to version control and update status',
      context: args,
      instructions: [
        'Update ADR status from "Proposed" to "Accepted"',
        'Add approval date to ADR document',
        'Save ADR to repository directory (e.g., docs/adr/)',
        'Create commit message: "docs(adr): add ADR-{number} {title}"',
        'Simulate git commit (document commit hash)',
        'Update ADR changelog',
        'Notify stakeholders of new ADR',
        'Document publication details'
      ],
      outputFormat: 'JSON with publishedPath (string), status (string), commitHash (string), publishDate (string), notificationsSent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'status', 'publishDate', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        status: { type: 'string', enum: ['Accepted', 'Proposed'] },
        commitHash: { type: 'string' },
        publishDate: { type: 'string' },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'publishing']
}));

// Task 9: ADR Index Update
export const adrIndexUpdateTask = defineTask('adr-index-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update ADR index and related links',
  agent: {
    name: 'adr-indexer',
    prompt: {
      role: 'ADR repository maintainer',
      task: 'Update ADR index, catalog, and related ADR links',
      context: args,
      instructions: [
        'Update ADR index/catalog (README or index.md)',
        'Add new entry with number, title, status, date',
        'Update related ADRs with bidirectional links',
        'If superseding old ADR, update old ADR status to "Superseded by ADR-{number}"',
        'Update ADR tags/categories index',
        'Regenerate table of contents if needed',
        'Update ADR statistics (total count, by status, by category)',
        'Save updated index to output directory'
      ],
      outputFormat: 'JSON with indexPath (string), totalAdrs (number), relatedAdrsUpdated (array), statistics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indexPath', 'totalAdrs', 'artifacts'],
      properties: {
        indexPath: { type: 'string' },
        totalAdrs: { type: 'number' },
        relatedAdrsUpdated: { type: 'array', items: { type: 'string' } },
        statistics: {
          type: 'object',
          properties: {
            accepted: { type: 'number' },
            proposed: { type: 'number' },
            deprecated: { type: 'number' },
            superseded: { type: 'number' }
          }
        },
        tagsUpdated: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr', 'indexing']
}));
