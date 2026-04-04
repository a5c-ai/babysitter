/**
 * @process specializations/domains/business/legal/contract-drafting-automation
 * @description Contract Drafting Automation - Automated contract drafting using templates, clause libraries, and playbooks
 * to accelerate agreement creation while maintaining legal standards and compliance requirements.
 * @inputs { contractType: string, parties?: array, templateId?: string, jurisdiction?: string, customClauses?: array, outputDir?: string }
 * @outputs { success: boolean, contractDraft: object, clausesUsed: array, complianceChecks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/contract-drafting-automation', {
 *   contractType: 'nda',
 *   parties: [
 *     { name: 'Acme Corp', role: 'disclosingParty', jurisdiction: 'Delaware' },
 *     { name: 'Beta Inc', role: 'receivingParty', jurisdiction: 'California' }
 *   ],
 *   templateId: 'mutual-nda-v2',
 *   jurisdiction: 'Delaware',
 *   customClauses: ['extended-confidentiality-period', 'carve-out-public-info'],
 *   outputDir: 'contracts/drafts'
 * });
 *
 * @references
 * - ABA Model Rules of Professional Conduct: https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/
 * - Contract Automation Best Practices: https://www.icertis.com/
 * - Legal Document Assembly: https://www.hotdocs.com/
 * - Thomson Reuters Contract Express: https://legal.thomsonreuters.com/en/products/contract-express
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contractType,
    parties = [],
    templateId = null,
    jurisdiction = 'United States',
    customClauses = [],
    businessTerms = {},
    effectiveDate = null,
    expirationDate = null,
    outputDir = 'contract-drafting-output',
    includeAlternativeClauses = true,
    includeNegotiationNotes = true,
    complianceFrameworks = ['general-contract-law']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let contractDraft = {};
  let clausesUsed = [];
  let complianceChecks = {};

  ctx.log('info', `Starting Contract Drafting Automation for ${contractType}`);
  ctx.log('info', `Jurisdiction: ${jurisdiction}, Parties: ${parties.length}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS GATHERING AND TEMPLATE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering requirements and selecting template');

  const requirementsGathering = await ctx.task(requirementsGatheringTask, {
    contractType,
    parties,
    templateId,
    jurisdiction,
    businessTerms,
    outputDir
  });

  if (!requirementsGathering.success) {
    return {
      success: false,
      error: 'Failed to gather contract requirements',
      details: requirementsGathering.error,
      phase: 'requirements-gathering',
      metadata: {
        processId: 'specializations/domains/business/legal/contract-drafting-automation',
        timestamp: startTime,
        contractType
      }
    };
  }

  artifacts.push(...requirementsGathering.artifacts);

  ctx.log('info', `Requirements gathered. Template: ${requirementsGathering.selectedTemplate}`);

  // ============================================================================
  // PHASE 2: CLAUSE LIBRARY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting clauses from clause library');

  const clauseSelection = await ctx.task(clauseSelectionTask, {
    contractType,
    jurisdiction,
    parties,
    templateId: requirementsGathering.selectedTemplate,
    customClauses,
    businessTerms,
    includeAlternativeClauses,
    outputDir
  });

  artifacts.push(...clauseSelection.artifacts);
  clausesUsed = clauseSelection.selectedClauses;

  ctx.log('info', `Selected ${clausesUsed.length} clauses for contract`);

  // ============================================================================
  // PHASE 3: PARTY INFORMATION ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 3: Assembling party information');

  const partyAssembly = await ctx.task(partyAssemblyTask, {
    parties,
    jurisdiction,
    contractType,
    outputDir
  });

  artifacts.push(...partyAssembly.artifacts);

  // ============================================================================
  // PHASE 4: CONTRACT DRAFT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating contract draft');

  const draftGeneration = await ctx.task(draftGenerationTask, {
    contractType,
    template: requirementsGathering.selectedTemplate,
    clauses: clauseSelection.selectedClauses,
    parties: partyAssembly.formattedParties,
    businessTerms,
    effectiveDate,
    expirationDate,
    jurisdiction,
    outputDir
  });

  artifacts.push(...draftGeneration.artifacts);
  contractDraft = draftGeneration.draft;

  ctx.log('info', 'Contract draft generated');

  // ============================================================================
  // PHASE 5: COMPLIANCE REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting compliance review');

  const complianceReview = await ctx.task(complianceReviewTask, {
    contractDraft,
    contractType,
    jurisdiction,
    complianceFrameworks,
    parties,
    outputDir
  });

  artifacts.push(...complianceReview.artifacts);
  complianceChecks = complianceReview.checks;

  const complianceScore = complianceReview.overallScore;

  ctx.log('info', `Compliance review complete. Score: ${complianceScore}/100`);

  // Quality Gate: Compliance threshold
  if (complianceScore < 80) {
    await ctx.breakpoint({
      question: `Contract compliance score is ${complianceScore}/100, below threshold of 80. Issues found: ${complianceReview.issues.length}. Review compliance issues and approve to continue?`,
      title: 'Contract Compliance Review',
      context: {
        runId: ctx.runId,
        contractType,
        complianceScore,
        issues: complianceReview.issues,
        recommendations: complianceReview.recommendations,
        files: complianceReview.artifacts.map(a => ({
          path: a.path,
          format: a.format || 'json',
          label: a.label || 'Compliance Report'
        }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: PLAYBOOK APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Applying negotiation playbook');

  const playbookApplication = await ctx.task(playbookApplicationTask, {
    contractType,
    contractDraft,
    clauses: clauseSelection.selectedClauses,
    parties,
    includeNegotiationNotes,
    outputDir
  });

  artifacts.push(...playbookApplication.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSURANCE
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing quality assurance');

  const qualityAssurance = await ctx.task(qualityAssuranceTask, {
    contractDraft,
    contractType,
    jurisdiction,
    clauses: clauseSelection.selectedClauses,
    complianceChecks,
    outputDir
  });

  artifacts.push(...qualityAssurance.artifacts);

  const qualityScore = qualityAssurance.overallScore;

  ctx.log('info', `Quality assurance complete. Score: ${qualityScore}/100`);

  // ============================================================================
  // PHASE 8: FINAL DRAFT ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 8: Assembling final draft');

  const finalAssembly = await ctx.task(finalAssemblyTask, {
    contractDraft,
    playbookNotes: playbookApplication.negotiationNotes,
    complianceReport: complianceReview,
    qualityReport: qualityAssurance,
    parties,
    contractType,
    jurisdiction,
    outputDir
  });

  artifacts.push(...finalAssembly.artifacts);

  // Final Breakpoint: Review and Approval
  await ctx.breakpoint({
    question: `Contract draft for ${contractType} is ready. Compliance Score: ${complianceScore}/100, Quality Score: ${qualityScore}/100. Review and approve final draft?`,
    title: 'Contract Draft Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        contractType,
        jurisdiction,
        partiesCount: parties.length,
        clausesUsed: clausesUsed.length,
        complianceScore,
        qualityScore,
        hasNegotiationNotes: includeNegotiationNotes
      },
      files: [
        { path: finalAssembly.draftPath, format: 'docx', label: 'Contract Draft' },
        { path: finalAssembly.summaryPath, format: 'markdown', label: 'Draft Summary' },
        ...artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contractType,
    jurisdiction,
    contractDraft: {
      path: finalAssembly.draftPath,
      version: finalAssembly.version,
      wordCount: finalAssembly.wordCount,
      pageCount: finalAssembly.pageCount
    },
    parties: partyAssembly.formattedParties,
    clausesUsed: clausesUsed.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      isCustom: c.isCustom || false
    })),
    complianceChecks: {
      overallScore: complianceScore,
      frameworksChecked: complianceFrameworks,
      issuesFound: complianceReview.issues.length,
      passed: complianceScore >= 80
    },
    qualityScore,
    negotiationPlaybook: playbookApplication.playbookPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-drafting-automation',
      timestamp: startTime,
      templateUsed: requirementsGathering.selectedTemplate,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather contract requirements and select template',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Drafting Specialist',
      task: 'Gather contract requirements and select appropriate template based on contract type, parties, and jurisdiction',
      context: args,
      instructions: [
        'Analyze contract type and determine required elements',
        'Review party information for completeness',
        'Select appropriate template from template library',
        'Identify jurisdiction-specific requirements',
        'Determine mandatory vs optional clauses',
        'Identify potential risk areas based on contract type',
        'Document business terms and special requirements',
        'Create requirements specification document',
        'Recommend template customizations needed'
      ],
      outputFormat: 'JSON with success, selectedTemplate, requirements, mandatoryClauses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedTemplate', 'requirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedTemplate: { type: 'string' },
        requirements: {
          type: 'object',
          properties: {
            contractType: { type: 'string' },
            essentialTerms: { type: 'array', items: { type: 'string' } },
            jurisdictionRequirements: { type: 'array', items: { type: 'string' } },
            riskAreas: { type: 'array', items: { type: 'string' } }
          }
        },
        mandatoryClauses: { type: 'array', items: { type: 'string' } },
        recommendedClauses: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-drafting', 'requirements']
}));

export const clauseSelectionTask = defineTask('clause-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select clauses from clause library',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Clause Specialist',
      task: 'Select appropriate clauses from clause library based on contract type, jurisdiction, and business requirements',
      context: args,
      instructions: [
        'Review clause library for contract type',
        'Select mandatory clauses for jurisdiction',
        'Include custom clauses as specified',
        'Select protective clauses based on party roles',
        'Include standard boilerplate clauses',
        'Identify alternative clause options for negotiation',
        'Order clauses in standard contract sequence',
        'Flag clauses requiring customization',
        'Document clause selection rationale'
      ],
      outputFormat: 'JSON with selectedClauses array, alternativeClauses, customizationNeeded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedClauses', 'artifacts'],
      properties: {
        selectedClauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              text: { type: 'string' },
              isCustom: { type: 'boolean' },
              requiresCustomization: { type: 'boolean' }
            }
          }
        },
        alternativeClauses: { type: 'array' },
        customizationNeeded: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-drafting', 'clauses']
}));

export const partyAssemblyTask = defineTask('party-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble party information',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Documentation Specialist',
      task: 'Format and validate party information for contract inclusion',
      context: args,
      instructions: [
        'Validate party legal names and entity types',
        'Verify jurisdiction of incorporation/formation',
        'Format party blocks for contract preamble',
        'Identify authorized signatories if provided',
        'Verify party addresses and contact information',
        'Determine party roles in contract',
        'Check for any party-specific requirements',
        'Format notice provisions for each party'
      ],
      outputFormat: 'JSON with formattedParties array, validationResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formattedParties', 'artifacts'],
      properties: {
        formattedParties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              legalName: { type: 'string' },
              entityType: { type: 'string' },
              jurisdiction: { type: 'string' },
              role: { type: 'string' },
              address: { type: 'string' },
              noticeAddress: { type: 'string' }
            }
          }
        },
        validationResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-drafting', 'parties']
}));

export const draftGenerationTask = defineTask('draft-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate contract draft',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Drafting Attorney',
      task: 'Generate complete contract draft by assembling template, clauses, and party information',
      context: args,
      instructions: [
        'Load and customize selected template',
        'Insert party information in preamble and recitals',
        'Assemble clauses in proper order',
        'Populate business terms throughout document',
        'Add effective date and term provisions',
        'Include signature blocks for all parties',
        'Add exhibits and schedules if needed',
        'Apply consistent formatting and numbering',
        'Generate table of contents if needed',
        'Save draft in appropriate format'
      ],
      outputFormat: 'JSON with draft object containing path and metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draft', 'artifacts'],
      properties: {
        draft: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            format: { type: 'string' },
            wordCount: { type: 'number' },
            sectionCount: { type: 'number' },
            hasExhibits: { type: 'boolean' }
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
  labels: ['agent', 'contract-drafting', 'generation']
}));

export const complianceReviewTask = defineTask('compliance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct compliance review',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Legal Compliance Reviewer',
      task: 'Review contract draft for compliance with applicable laws, regulations, and internal policies',
      context: args,
      instructions: [
        'Check compliance with jurisdiction-specific contract law',
        'Verify required statutory provisions are included',
        'Review for regulatory compliance (industry-specific)',
        'Check internal policy compliance',
        'Identify potentially unenforceable provisions',
        'Flag provisions requiring legal review',
        'Assess liability and indemnification provisions',
        'Review limitation of liability clauses',
        'Check intellectual property provisions',
        'Score overall compliance and list issues'
      ],
      outputFormat: 'JSON with overallScore, checks object, issues array, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'checks', 'issues', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: {
          type: 'object',
          properties: {
            contractLaw: { type: 'boolean' },
            regulatoryCompliance: { type: 'boolean' },
            internalPolicy: { type: 'boolean' },
            enforceability: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['agent', 'contract-drafting', 'compliance']
}));

export const playbookApplicationTask = defineTask('playbook-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply negotiation playbook',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Negotiation Specialist',
      task: 'Apply negotiation playbook to contract draft, adding fallback positions and negotiation guidance',
      context: args,
      instructions: [
        'Identify negotiable terms in contract',
        'Apply playbook rules for contract type',
        'Add fallback positions for key terms',
        'Document escalation thresholds',
        'Include alternative clause language options',
        'Add internal negotiation notes (not visible in final)',
        'Identify deal-breaker provisions',
        'Document authority levels for modifications',
        'Create negotiation summary document'
      ],
      outputFormat: 'JSON with negotiationNotes, fallbackPositions, playbookPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['negotiationNotes', 'playbookPath', 'artifacts'],
      properties: {
        negotiationNotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clause: { type: 'string' },
              position: { type: 'string' },
              fallback: { type: 'string' },
              escalationRequired: { type: 'boolean' }
            }
          }
        },
        fallbackPositions: { type: 'object' },
        dealBreakers: { type: 'array', items: { type: 'string' } },
        playbookPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-drafting', 'playbook']
}));

export const qualityAssuranceTask = defineTask('quality-assurance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform quality assurance',
  agent: {
    name: 'legal-qa-specialist',
    prompt: {
      role: 'Legal Quality Assurance Specialist',
      task: 'Review contract draft for quality, consistency, and completeness',
      context: args,
      instructions: [
        'Check document formatting consistency',
        'Verify cross-references are accurate',
        'Check defined terms usage consistency',
        'Verify all blanks and variables are filled',
        'Check for grammatical and typographical errors',
        'Verify section numbering is correct',
        'Check exhibit references',
        'Verify signature blocks are complete',
        'Assess overall document quality',
        'Generate quality score and recommendations'
      ],
      outputFormat: 'JSON with overallScore, qualityChecks, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'qualityChecks', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityChecks: {
          type: 'object',
          properties: {
            formatting: { type: 'number' },
            crossReferences: { type: 'number' },
            definedTerms: { type: 'number' },
            completeness: { type: 'number' },
            grammar: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-drafting', 'qa']
}));

export const finalAssemblyTask = defineTask('final-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble final draft',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Assembly Specialist',
      task: 'Assemble final contract draft package with all supporting documents',
      context: args,
      instructions: [
        'Finalize contract document with all corrections',
        'Generate clean draft (without negotiation notes)',
        'Generate marked draft (with negotiation guidance)',
        'Create contract summary document',
        'Package all exhibits and schedules',
        'Create signing instruction document',
        'Generate version metadata',
        'Save all documents in appropriate formats',
        'Create final assembly report'
      ],
      outputFormat: 'JSON with draftPath, summaryPath, version, wordCount, pageCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath', 'summaryPath', 'version', 'artifacts'],
      properties: {
        draftPath: { type: 'string' },
        markedDraftPath: { type: 'string' },
        summaryPath: { type: 'string' },
        version: { type: 'string' },
        wordCount: { type: 'number' },
        pageCount: { type: 'number' },
        exhibitPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-drafting', 'assembly']
}));
