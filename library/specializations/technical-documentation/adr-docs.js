/**
 * @process technical-documentation/adr-docs
 * @description Complete Architecture Decision Records (ADR) documentation lifecycle with decision analysis, alternatives research, template-based drafting, quality validation, review workflow, and repository maintenance
 * @inputs { decision: string, context: object, stakeholders: array, adrNumber: number, outputDir: string, relatedAdrs: array, template: string }
 * @outputs { success: boolean, adrDocument: string, adrNumber: string, status: string, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    decision = '',
    context = {},
    stakeholders = [],
    adrNumber = null,
    outputDir = 'adr-docs-output',
    relatedAdrs = [],
    template = 'nygard', // nygard, madr, y-statements, or custom
    requireApproval = true,
    autoPublish = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting ADR Documentation Process');

  // ============================================================================
  // PHASE 1: DECISION SIGNIFICANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing decision significance and scope');
  const significanceAnalysis = await ctx.task(decisionSignificanceAnalysisTask, {
    decision,
    context,
    stakeholders,
    outputDir
  });

  artifacts.push(...significanceAnalysis.artifacts);

  if (!significanceAnalysis.warrantsAdr) {
    ctx.log('warn', 'Decision does not warrant ADR - recommending alternative documentation');
    return {
      success: false,
      reason: 'Decision does not warrant ADR',
      warrantsAdr: false,
      recommendation: significanceAnalysis.recommendation,
      alternativeDocumentation: significanceAnalysis.alternativeDocumentation,
      rationale: significanceAnalysis.rationale,
      artifacts,
      metadata: {
        processId: 'technical-documentation/adr-docs',
        timestamp: startTime,
        duration: ctx.now() - startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: CONTEXT GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 2: Gathering decision context and constraints');
  const contextGathering = await ctx.task(contextGatheringTask, {
    decision: significanceAnalysis.refinedDecision,
    context,
    stakeholders,
    significanceAnalysis,
    outputDir
  });

  artifacts.push(...contextGathering.artifacts);

  // ============================================================================
  // PHASE 3: ALTERNATIVES RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 3: Researching and evaluating alternatives');
  const alternativesResearch = await ctx.task(alternativesResearchTask, {
    decision: significanceAnalysis.refinedDecision,
    context: contextGathering.enhancedContext,
    constraints: contextGathering.constraints,
    requirements: contextGathering.requirements,
    outputDir
  });

  artifacts.push(...alternativesResearch.artifacts);

  // ============================================================================
  // PHASE 4: ADR NUMBERING
  // ============================================================================

  ctx.log('info', 'Phase 4: Assigning ADR number and filename');
  const adrNumbering = await ctx.task(adrNumberingTask, {
    proposedNumber: adrNumber,
    decision: significanceAnalysis.refinedDecision,
    outputDir
  });

  const assignedAdrNumber = adrNumbering.adrNumber;
  const adrFilename = adrNumbering.filename;
  artifacts.push(...adrNumbering.artifacts);

  // ============================================================================
  // PHASE 5: ADR DRAFTING
  // ============================================================================

  ctx.log('info', `Phase 5: Drafting ADR-${assignedAdrNumber} using ${template} template`);
  const adrDraft = await ctx.task(adrDraftingTask, {
    adrNumber: assignedAdrNumber,
    filename: adrFilename,
    decision: significanceAnalysis.refinedDecision,
    context: contextGathering.enhancedContext,
    alternatives: alternativesResearch.alternatives,
    chosenOption: alternativesResearch.recommendedOption,
    consequences: alternativesResearch.consequences,
    tradeOffs: alternativesResearch.tradeOffs,
    relatedAdrs,
    template,
    outputDir
  });

  artifacts.push(...adrDraft.artifacts);

  // ============================================================================
  // PHASE 6: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating ADR quality and completeness');
  const qualityValidation = await ctx.task(adrQualityValidationTask, {
    adrNumber: assignedAdrNumber,
    adrDocument: adrDraft.adrDocument,
    decision: significanceAnalysis.refinedDecision,
    alternatives: alternativesResearch.alternatives,
    template,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 80;

  // Breakpoint: Review draft ADR
  await ctx.breakpoint({
    question: `ADR-${assignedAdrNumber} draft complete. Quality score: ${qualityScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review draft?`,
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
        filename: adrFilename,
        decision: significanceAnalysis.refinedDecision,
        qualityScore,
        qualityMet,
        template,
        alternativesConsidered: alternativesResearch.alternatives.length,
        consequencesDocumented: alternativesResearch.consequences.positive.length + alternativesResearch.consequences.negative.length
      }
    }
  });

  // ============================================================================
  // PHASE 7: STAKEHOLDER REVIEW (Optional)
  // ============================================================================

  let reviewResult = null;
  let finalAdr = adrDraft;

  if (requireApproval) {
    ctx.log('info', 'Phase 7: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      adrNumber: assignedAdrNumber,
      filename: adrFilename,
      adrDocument: adrDraft.adrDocument,
      stakeholders,
      qualityValidation,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Approval gate
    await ctx.breakpoint({
      question: `ADR-${assignedAdrNumber} review complete. ${reviewResult.approved ? 'Approved by stakeholders!' : 'Requires revisions.'} Proceed?`,
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
    if (reviewResult.revisionsNeeded) {
      ctx.log('info', 'Incorporating stakeholder feedback');
      const revision = await ctx.task(adrRevisionTask, {
        adrNumber: assignedAdrNumber,
        filename: adrFilename,
        adrDocument: adrDraft.adrDocument,
        feedback: reviewResult.feedback,
        outputDir
      });
      finalAdr = revision;
      artifacts.push(...revision.artifacts);
    }
  }

  // ============================================================================
  // PHASE 8: ADR PUBLISHING
  // ============================================================================

  ctx.log('info', 'Phase 8: Publishing ADR to repository');
  const publishResult = await ctx.task(adrPublishingTask, {
    adrNumber: assignedAdrNumber,
    filename: adrFilename,
    adrDocument: finalAdr.adrDocument,
    relatedAdrs,
    autoPublish,
    outputDir
  });

  artifacts.push(...publishResult.artifacts);

  // ============================================================================
  // PHASE 9: INDEX UPDATE
  // ============================================================================

  ctx.log('info', 'Phase 9: Updating ADR index and cross-references');
  const indexUpdate = await ctx.task(adrIndexUpdateTask, {
    adrNumber: assignedAdrNumber,
    filename: adrFilename,
    decision: significanceAnalysis.refinedDecision,
    status: publishResult.status,
    relatedAdrs,
    tags: context.tags || [],
    category: context.category || 'general',
    outputDir
  });

  artifacts.push(...indexUpdate.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating supporting documentation');
  const supportingDocs = await ctx.task(supportingDocumentationTask, {
    adrNumber: assignedAdrNumber,
    filename: adrFilename,
    decision: significanceAnalysis.refinedDecision,
    alternatives: alternativesResearch.alternatives,
    consequences: alternativesResearch.consequences,
    qualityScore,
    template,
    outputDir
  });

  artifacts.push(...supportingDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    adrNumber: assignedAdrNumber,
    filename: adrFilename,
    decision: significanceAnalysis.refinedDecision,
    status: publishResult.status,
    adrDocument: publishResult.publishedPath,
    qualityScore,
    qualityMet,
    approved: reviewResult ? reviewResult.approved : true,
    template,
    alternatives: {
      total: alternativesResearch.alternatives.length,
      chosen: alternativesResearch.recommendedOption,
      evaluated: alternativesResearch.alternatives.map(a => a.name)
    },
    consequences: {
      positive: alternativesResearch.consequences.positive.length,
      negative: alternativesResearch.consequences.negative.length,
      neutral: alternativesResearch.consequences.neutral.length,
      risks: alternativesResearch.consequences.risks?.length || 0
    },
    context: {
      constraints: contextGathering.constraints.length,
      requirements: contextGathering.requirements.length,
      stakeholders: stakeholders.length,
      relatedAdrs: relatedAdrs.length
    },
    index: {
      totalAdrs: indexUpdate.totalAdrs,
      byStatus: indexUpdate.statistics
    },
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/adr-docs',
      timestamp: startTime,
      outputDir,
      template,
      warrantsAdr: true,
      autoPublished: autoPublish
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Decision Significance Analysis
export const decisionSignificanceAnalysisTask = defineTask('decision-significance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze decision significance and ADR worthiness',
  agent: {
    name: 'architecture-analyst',
    prompt: {
      role: 'principal software architect and decision analyst',
      task: 'Evaluate whether the decision is architecturally significant and warrants an ADR',
      context: args,
      instructions: [
        'Assess if decision is architecturally significant using criteria:',
        '  - Affects system structure, components, or boundaries',
        '  - Impacts non-functional requirements (performance, security, scalability)',
        '  - Introduces or changes dependencies on external systems or frameworks',
        '  - Affects multiple teams or has organizational impact',
        '  - Difficult or costly to reverse',
        '  - Has long-term implications (> 6 months)',
        '  - Involves significant trade-offs between quality attributes',
        'ADR IS warranted if decision meets 2+ criteria above',
        'ADR NOT warranted if:',
        '  - Trivial implementation detail',
        '  - Temporary workaround or hotfix',
        '  - Code-level refactoring without architectural impact',
        '  - Personal coding style preference',
        '  - Fully reversible with minimal effort',
        'If not warranted, recommend alternative documentation (code comment, wiki, spike doc)',
        'If warranted, refine decision statement for clarity and specificity',
        'Identify key stakeholders who should be involved',
        'Assess reversibility and impact level',
        'Save significance analysis to output directory'
      ],
      outputFormat: 'JSON with warrantsAdr (boolean), refinedDecision (string), rationale (string), significanceCriteriaMet (array), impactLevel (string), reversibility (string), stakeholders (array), recommendation (string), alternativeDocumentation (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['warrantsAdr', 'rationale', 'artifacts'],
      properties: {
        warrantsAdr: { type: 'boolean' },
        refinedDecision: { type: 'string' },
        rationale: { type: 'string' },
        significanceCriteriaMet: { type: 'array', items: { type: 'string' } },
        impactLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        reversibility: { type: 'string', enum: ['easy', 'moderate', 'difficult', 'irreversible'] },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              interest: { type: 'string' }
            }
          }
        },
        recommendation: { type: 'string' },
        alternativeDocumentation: { type: 'string' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              label: { type: 'string' }
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
  labels: ['agent', 'adr-docs', 'significance-analysis', 'technical-documentation']
}));

// Task 2: Context Gathering
export const contextGatheringTask = defineTask('context-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather comprehensive decision context',
  agent: {
    name: 'context-researcher',
    prompt: {
      role: 'technical analyst and requirements engineer',
      task: 'Gather comprehensive context including forces, constraints, requirements, and triggering factors',
      context: args,
      instructions: [
        'Document the triggering event or catalyst for this decision (why now?)',
        'Identify business drivers and strategic goals',
        'Identify technical forces at play:',
        '  - Current technical landscape',
        '  - Technical debt considerations',
        '  - Scalability requirements',
        '  - Performance constraints',
        '  - Security requirements',
        'Identify organizational forces:',
        '  - Team skills and capabilities',
        '  - Time and budget constraints',
        '  - Regulatory or compliance requirements',
        '  - Vendor relationships',
        'Identify political and social forces:',
        '  - Stakeholder preferences',
        '  - Past decisions and legacy',
        '  - Team dynamics',
        'Document explicit constraints (must-haves)',
        'Document requirements this decision must satisfy',
        'Identify assumptions being made',
        'Research industry practices and benchmarks',
        'Save comprehensive context document to output directory'
      ],
      outputFormat: 'JSON with enhancedContext (object with businessDrivers, technicalForces, organizationalForces, politicalForces), constraints (array), requirements (array), assumptions (array), triggeringEvent (string), industryPractices (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['enhancedContext', 'constraints', 'requirements', 'triggeringEvent', 'artifacts'],
      properties: {
        enhancedContext: {
          type: 'object',
          properties: {
            businessDrivers: { type: 'array', items: { type: 'string' } },
            technicalForces: { type: 'array', items: { type: 'string' } },
            organizationalForces: { type: 'array', items: { type: 'string' } },
            politicalForces: { type: 'array', items: { type: 'string' } }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              type: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              category: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        triggeringEvent: { type: 'string' },
        industryPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr-docs', 'context-gathering', 'technical-documentation']
}));

// Task 3: Alternatives Research
export const alternativesResearchTask = defineTask('alternatives-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research and evaluate decision alternatives',
  agent: {
    name: 'solutions-architect',
    prompt: {
      role: 'solutions architect and technology researcher',
      task: 'Research viable alternatives, analyze pros/cons, and recommend optimal option',
      context: args,
      instructions: [
        'Identify minimum 3 viable alternatives (including "do nothing" if applicable)',
        'For each alternative, thoroughly research:',
        '  - Description and implementation approach',
        '  - Pros (benefits, strengths, advantages)',
        '  - Cons (drawbacks, limitations, weaknesses)',
        '  - Technical feasibility and maturity',
        '  - Implementation effort and complexity',
        '  - Maintenance and operational costs',
        '  - Risk assessment (technical, operational, business)',
        '  - Alignment with constraints and requirements',
        'Compare alternatives using decision matrix with weighted criteria',
        'Consider prototyping or proof-of-concept for high-uncertainty alternatives',
        'Evaluate against requirements and constraints',
        'Identify the recommended option with clear justification',
        'Document consequences of chosen option:',
        '  - Positive consequences (benefits realized)',
        '  - Negative consequences (costs, limitations, risks)',
        '  - Neutral consequences (changes without clear positive/negative)',
        '  - Risks and mitigation strategies',
        'Document trade-offs explicitly',
        'Identify follow-up decisions or dependencies',
        'Save alternatives analysis with decision matrix to output directory'
      ],
      outputFormat: 'JSON with alternatives (array), recommendedOption (string), justification (string), consequences (object with positive, negative, neutral, risks arrays), tradeOffs (array), decisionMatrix (object), followUpDecisions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'recommendedOption', 'justification', 'consequences', 'tradeOffs', 'artifacts'],
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
              cost: { type: 'string' },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] },
              score: { type: 'number' }
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
            neutral: { type: 'array', items: { type: 'string' } },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  mitigation: { type: 'string' },
                  severity: { type: 'string' }
                }
              }
            }
          }
        },
        tradeOffs: { type: 'array', items: { type: 'string' } },
        decisionMatrix: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            scores: { type: 'object' }
          }
        },
        followUpDecisions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr-docs', 'alternatives-research', 'technical-documentation']
}));

// Task 4: ADR Numbering
export const adrNumberingTask = defineTask('adr-numbering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign sequential ADR number',
  agent: {
    name: 'adr-registry-manager',
    prompt: {
      role: 'ADR repository manager and documentation coordinator',
      task: 'Assign next sequential ADR number and generate standardized filename',
      context: args,
      instructions: [
        'Check existing ADR repository for highest assigned number',
        'If proposedNumber provided, validate it is available and sequential',
        'Assign next sequential number (if last is 0015, assign 0016)',
        'Use 4-digit zero-padded format (0001, 0002, ..., 0099, 0100)',
        'Generate slug from decision title:',
        '  - Convert to lowercase',
        '  - Replace spaces with hyphens',
        '  - Remove special characters except hyphens',
        '  - Limit to 50 characters',
        '  - Ensure uniqueness',
        'Create ADR filename: ADR-{number}-{slug}.md',
        'Examples:',
        '  - "Use PostgreSQL for data storage" → ADR-0023-use-postgresql-for-data-storage.md',
        '  - "Adopt microservices architecture" → ADR-0024-adopt-microservices-architecture.md',
        'Validate filename does not conflict with existing ADRs',
        'Save numbering metadata to output directory'
      ],
      outputFormat: 'JSON with adrNumber (string like "0016"), filename (string), slug (string), previousHighest (string), conflicts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrNumber', 'filename', 'slug', 'artifacts'],
      properties: {
        adrNumber: { type: 'string', pattern: '^[0-9]{4}$' },
        filename: { type: 'string' },
        slug: { type: 'string' },
        previousHighest: { type: 'string' },
        conflicts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr-docs', 'numbering', 'technical-documentation']
}));

// Task 5: ADR Drafting
export const adrDraftingTask = defineTask('adr-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft ADR document using template',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer and software architect',
      task: 'Draft comprehensive ADR document using specified template format',
      context: args,
      instructions: [
        'Select appropriate template format:',
        '',
        '**Nygard ADR Template** (default, most popular):',
        '```markdown',
        '# ADR {number}: {Title}',
        '',
        '## Status',
        'Proposed | Accepted | Deprecated | Superseded by ADR-XXXX',
        '',
        '## Context',
        'Describe the forces at play (technical, political, social, project).',
        'Include business drivers, technical constraints, triggering event.',
        'Explain why this decision is needed NOW.',
        '',
        '## Decision',
        'State the decision clearly and completely.',
        'Use active voice: "We will..."',
        'Be specific and unambiguous.',
        '',
        '## Consequences',
        'Document what becomes easier or harder after this decision.',
        '- Positive: Benefits and improvements',
        '- Negative: Costs, risks, limitations',
        '- Neutral: Changes without clear positive/negative impact',
        '',
        '## Alternatives Considered',
        'List alternatives evaluated and why they were not chosen.',
        '',
        '## Related Decisions',
        '- Supersedes: ADR-XXXX',
        '- Superseded by: None',
        '- Related to: ADR-XXXX, ADR-YYYY',
        '```',
        '',
        '**MADR Template** (Markdown ADR):',
        'Include additional sections: Options, Pros/Cons table, Links',
        '',
        '**Y-Statements Template**:',
        '"In the context of {context}, facing {concern}, we decided for {option} to achieve {quality}, accepting {downside}."',
        '',
        'ADR Writing Best Practices:',
        '- Keep ADR concise (1-3 pages target)',
        '- Write for future readers who lack current context',
        '- Use clear, jargon-free language where possible',
        '- Be honest about trade-offs and limitations',
        '- Include dates (decision date, last updated)',
        '- Set initial status to "Proposed"',
        '- Include author/decider information',
        '- Add tags/categories for organization',
        '- Use markdown formatting for readability',
        '- Include links to related resources, tickets, code',
        '',
        'Save complete ADR document to output directory'
      ],
      outputFormat: 'JSON with adrDocument (string - full markdown content), metadata (object with number, title, status, date, author, tags), wordCount (number), estimatedReadTime (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrDocument', 'metadata', 'wordCount', 'artifacts'],
      properties: {
        adrDocument: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            number: { type: 'string' },
            filename: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['Proposed', 'Accepted', 'Deprecated', 'Superseded'] },
            date: { type: 'string' },
            author: { type: 'string' },
            deciders: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' }
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
  labels: ['agent', 'adr-docs', 'drafting', 'technical-documentation']
}));

// Task 6: ADR Quality Validation
export const adrQualityValidationTask = defineTask('adr-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate ADR quality and completeness',
  agent: {
    name: 'adr-quality-auditor',
    prompt: {
      role: 'principal architect and ADR quality auditor',
      task: 'Assess ADR quality, completeness, and adherence to best practices',
      context: args,
      instructions: [
        'Evaluate Context section (weight: 25%):',
        '  - Are forces at play clearly explained?',
        '  - Is triggering event documented?',
        '  - Are business drivers identified?',
        '  - Are constraints documented?',
        '  - Score: 0-100',
        '',
        'Evaluate Decision section (weight: 25%):',
        '  - Is decision stated clearly and unambiguously?',
        '  - Can it be implemented based on this description?',
        '  - Is it written in active voice?',
        '  - Is it specific (not vague)?',
        '  - Score: 0-100',
        '',
        'Evaluate Consequences documentation (weight: 25%):',
        '  - Are positive consequences listed?',
        '  - Are negative consequences honestly documented?',
        '  - Are trade-offs explicitly stated?',
        '  - Are risks identified?',
        '  - Is implementation effort estimated?',
        '  - Score: 0-100',
        '',
        'Evaluate Alternatives consideration (weight: 15%):',
        '  - Were multiple alternatives researched?',
        '  - Are alternatives documented in ADR?',
        '  - Are rejection reasons explained?',
        '  - Score: 0-100',
        '',
        'Evaluate overall ADR quality (weight: 10%):',
        '  - Is writing clear and concise?',
        '  - Is ADR appropriately scoped (not too broad/narrow)?',
        '  - Are related ADRs linked?',
        '  - Is formatting consistent?',
        '  - Are dates and metadata present?',
        '  - Score: 0-100',
        '',
        'Calculate weighted overall score (0-100)',
        'Identify completeness gaps and missing elements',
        'Provide specific, actionable improvement recommendations',
        'Assess readiness for stakeholder review',
        'Check compliance with ADR best practices',
        'Save quality validation report to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object with contextClarity, decisionClarity, consequencesCompleteness, alternativesDocumented, overallQuality), completeness (object with boolean checks), gaps (array), recommendations (array), strengths (array), reviewReadiness (string), bestPracticesCompliance (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'completeness', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            contextClarity: { type: 'number', minimum: 0, maximum: 100 },
            decisionClarity: { type: 'number', minimum: 0, maximum: 100 },
            consequencesCompleteness: { type: 'number', minimum: 0, maximum: 100 },
            alternativesDocumented: { type: 'number', minimum: 0, maximum: 100 },
            overallQuality: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            hasContext: { type: 'boolean' },
            hasDecision: { type: 'boolean' },
            hasConsequences: { type: 'boolean' },
            hasAlternatives: { type: 'boolean' },
            hasRelatedLinks: { type: 'boolean' },
            hasMetadata: { type: 'boolean' },
            hasTriggeringEvent: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        reviewReadiness: { type: 'string', enum: ['ready', 'minor-improvements', 'major-revisions'] },
        bestPracticesCompliance: {
          type: 'object',
          properties: {
            concise: { type: 'boolean' },
            clearLanguage: { type: 'boolean' },
            honestAboutTradeoffs: { type: 'boolean' },
            futureReaderFriendly: { type: 'boolean' }
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
  labels: ['agent', 'adr-docs', 'quality-validation', 'technical-documentation']
}));

// Task 7: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review and approval',
  agent: {
    name: 'review-facilitator',
    prompt: {
      role: 'architecture review board facilitator and stakeholder coordinator',
      task: 'Facilitate ADR review with stakeholders, gather feedback, and determine approval',
      context: args,
      instructions: [
        'Simulate review meeting with identified stakeholders',
        'Review ADR completeness using quality validation results',
        'Evaluate technical soundness of decision',
        'Assess alignment with:',
        '  - Architectural principles and standards',
        '  - Strategic technical direction',
        '  - Organizational constraints',
        '  - Security and compliance requirements',
        'Check for unintended consequences or blind spots',
        'Gather feedback from each reviewer:',
        '  - Reviewer name and role',
        '  - Specific comments and concerns',
        '  - Severity (minor, major, blocker)',
        'Identify consensus areas and disagreements',
        'Document concerns and suggestions',
        'Determine if revisions are needed',
        'Recommend approval, conditional approval, or rejection',
        'If approved with feedback, list specific revision items',
        'Document approval conditions if any',
        'Save review meeting minutes to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), revisionsNeeded (boolean), revisionItems (array), concerns (array), consensus (array), disagreements (array), approvalConditions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'revisionsNeeded', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              vote: { type: 'string', enum: ['approve', 'approve-with-changes', 'reject'] }
            }
          }
        },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'major', 'blocker'] },
              section: { type: 'string' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        revisionItems: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        consensus: { type: 'array', items: { type: 'string' } },
        disagreements: { type: 'array', items: { type: 'string' } },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr-docs', 'stakeholder-review', 'technical-documentation']
}));

// Task 8: ADR Revision
export const adrRevisionTask = defineTask('adr-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Incorporate stakeholder feedback',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and editor',
      task: 'Revise ADR document based on stakeholder feedback',
      context: args,
      instructions: [
        'Review all feedback items by severity',
        'Address all blocker issues (mandatory)',
        'Address all major issues (high priority)',
        'Incorporate minor suggestions where appropriate',
        'Maintain ADR structure and format',
        'Update affected sections:',
        '  - Context (if forces need clarification)',
        '  - Decision (if statement needs refinement)',
        '  - Consequences (if additional impacts identified)',
        '  - Alternatives (if missing options noted)',
        'Add clarifications and missing details',
        'Improve language clarity if feedback indicates confusion',
        'Document revision history:',
        '  - What changed',
        '  - Why it changed',
        '  - Which feedback item it addresses',
        'Maintain version in document metadata',
        'Save revised ADR document to output directory'
      ],
      outputFormat: 'JSON with adrDocument (string - revised markdown), changesApplied (array), feedbackAddressed (array), revisionHistory (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrDocument', 'changesApplied', 'feedbackAddressed', 'artifacts'],
      properties: {
        adrDocument: { type: 'string' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' },
              feedbackId: { type: 'string' }
            }
          }
        },
        feedbackAddressed: { type: 'array', items: { type: 'string' } },
        revisionHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              date: { type: 'string' },
              changes: { type: 'string' }
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
  labels: ['agent', 'adr-docs', 'revision', 'technical-documentation']
}));

// Task 9: ADR Publishing
export const adrPublishingTask = defineTask('adr-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish ADR to repository',
  agent: {
    name: 'adr-publisher',
    prompt: {
      role: 'ADR repository manager and release coordinator',
      task: 'Publish ADR to version control and update status',
      context: args,
      instructions: [
        'Update ADR status from "Proposed" to "Accepted"',
        'Add decision date to ADR document',
        'Add approval metadata (approvers, approval date)',
        'Determine target repository path:',
        '  - Typical: docs/adr/, docs/decisions/, architecture/decisions/',
        '  - Organize by category if applicable',
        'Save ADR to repository directory with assigned filename',
        'Generate git commit if autoPublish enabled:',
        '  - Commit message format: "docs(adr): add ADR-{number} {title}"',
        '  - Or: "docs: add architecture decision record for {topic}"',
        '  - Simulate git commit (document commit hash)',
        'Update ADR changelog if exists',
        'Prepare stakeholder notifications:',
        '  - Email distribution list',
        '  - Slack/Teams channel notifications',
        '  - Wiki updates if applicable',
        'Document publication details',
        'Generate publication summary',
        'Save publication metadata to output directory'
      ],
      outputFormat: 'JSON with publishedPath (string), status (string), commitHash (string), publishDate (string), approvalDate (string), notificationsSent (array), repositoryPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'status', 'publishDate', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        status: { type: 'string', enum: ['Accepted', 'Proposed', 'Deprecated', 'Superseded'] },
        commitHash: { type: 'string' },
        publishDate: { type: 'string' },
        approvalDate: { type: 'string' },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        repositoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr-docs', 'publishing', 'technical-documentation']
}));

// Task 10: ADR Index Update
export const adrIndexUpdateTask = defineTask('adr-index-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update ADR index and cross-references',
  agent: {
    name: 'adr-indexer',
    prompt: {
      role: 'ADR repository maintainer and documentation coordinator',
      task: 'Update ADR index, catalog, related ADR links, and generate statistics',
      context: args,
      instructions: [
        'Update main ADR index (README.md or index.md):',
        '  - Add new entry with format: | ADR-{number} | {date} | {title} | {status} |',
        '  - Maintain chronological or categorical order',
        '  - Ensure markdown table formatting',
        'Update category-specific indexes if applicable',
        'Update related ADRs with bidirectional links:',
        '  - Add "Related to: ADR-{number}" in related documents',
        '  - Ensure bidirectional consistency',
        'If this ADR supersedes another:',
        '  - Update old ADR status to "Superseded by ADR-{number}"',
        '  - Update old ADR date',
        '  - Add link in new ADR: "Supersedes: ADR-{old-number}"',
        'Update tags/categories index:',
        '  - Add to category lists',
        '  - Update tag cloud or tag index',
        'Regenerate table of contents if needed',
        'Update ADR statistics:',
        '  - Total count',
        '  - Count by status (Accepted, Proposed, Deprecated, Superseded)',
        '  - Count by category',
        '  - Recent additions (last 30 days)',
        'Generate ADR dependency graph data if applicable',
        'Save updated indexes to output directory'
      ],
      outputFormat: 'JSON with indexPath (string), totalAdrs (number), relatedAdrsUpdated (array), supersededAdrs (array), statistics (object with accepted, proposed, deprecated, superseded), byCategory (object), tagsUpdated (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indexPath', 'totalAdrs', 'statistics', 'artifacts'],
      properties: {
        indexPath: { type: 'string' },
        totalAdrs: { type: 'number' },
        relatedAdrsUpdated: { type: 'array', items: { type: 'string' } },
        supersededAdrs: { type: 'array', items: { type: 'string' } },
        statistics: {
          type: 'object',
          properties: {
            accepted: { type: 'number' },
            proposed: { type: 'number' },
            deprecated: { type: 'number' },
            superseded: { type: 'number' }
          }
        },
        byCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        tagsUpdated: { type: 'array', items: { type: 'string' } },
        recentAdditions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'adr-docs', 'indexing', 'technical-documentation']
}));

// Task 11: Supporting Documentation
export const supportingDocumentationTask = defineTask('supporting-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate supporting documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate supporting documentation including decision summary, timeline, and reference materials',
      context: args,
      instructions: [
        'Generate executive summary document:',
        '  - One-page decision summary',
        '  - Key points and outcomes',
        '  - For stakeholder distribution',
        'Generate decision timeline:',
        '  - Triggering event date',
        '  - Research and alternatives phase',
        '  - Draft creation date',
        '  - Review and approval dates',
        '  - Publication date',
        '  - Milestones and key events',
        'Generate alternatives comparison table:',
        '  - Side-by-side comparison',
        '  - Decision matrix visualization',
        '  - Scoring breakdown',
        'Generate consequences summary:',
        '  - Impact assessment',
        '  - Risk matrix',
        '  - Mitigation plan',
        'Generate implementation guide if applicable:',
        '  - Next steps',
        '  - Action items',
        '  - Owner assignments',
        '  - Timeline',
        'Generate reference links document:',
        '  - Research sources',
        '  - Related documentation',
        '  - Code repositories',
        '  - External resources',
        'Save all supporting documents to output directory'
      ],
      outputFormat: 'JSON with executiveSummary (string), timeline (object), comparisonTable (string), consequencesSummary (string), implementationGuide (object), references (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'timeline', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        timeline: {
          type: 'object',
          properties: {
            triggeringEvent: { type: 'string' },
            draftCreated: { type: 'string' },
            reviewCompleted: { type: 'string' },
            published: { type: 'string' },
            milestones: { type: 'array', items: { type: 'object' } }
          }
        },
        comparisonTable: { type: 'string' },
        consequencesSummary: { type: 'string' },
        implementationGuide: {
          type: 'object',
          properties: {
            nextSteps: { type: 'array', items: { type: 'string' } },
            actionItems: { type: 'array', items: { type: 'object' } },
            timeline: { type: 'string' }
          }
        },
        references: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              type: { type: 'string' }
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
  labels: ['agent', 'adr-docs', 'supporting-documentation', 'technical-documentation']
}));
