/**
 * @process specializations/domains/business/legal/contract-negotiation-playbook
 * @description Contract Negotiation Playbook Development - Create comprehensive negotiation playbooks with fallback
 * positions, escalation paths, and authority matrices for consistent deal-making.
 * @inputs { contractType: string, partyRole?: string, jurisdiction?: string, riskTolerance?: string, outputDir?: string }
 * @outputs { success: boolean, playbook: object, positions: array, escalationMatrix: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/contract-negotiation-playbook', {
 *   contractType: 'master-services-agreement',
 *   partyRole: 'customer',
 *   jurisdiction: 'United States',
 *   riskTolerance: 'medium',
 *   outputDir: 'playbooks'
 * });
 *
 * @references
 * - Contract Negotiation Handbook: https://www.amazon.com/Contract-Negotiation-Handbook-Getting-Company/dp/1461061083
 * - WorldCC Negotiation Standards: https://www.worldcc.com/
 * - Harvard Negotiation Project: https://www.pon.harvard.edu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contractType,
    partyRole = 'customer',
    jurisdiction = 'United States',
    riskTolerance = 'medium',
    industryVertical = 'general',
    dealValue = null,
    strategicImportance = 'standard',
    outputDir = 'playbook-output',
    includeTemplateLanguage = true,
    includeEscalationPaths = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let playbook = {};
  let positions = [];
  let escalationMatrix = {};

  ctx.log('info', `Starting Playbook Development for ${contractType}`);
  ctx.log('info', `Role: ${partyRole}, Risk Tolerance: ${riskTolerance}`);

  // ============================================================================
  // PHASE 1: CONTRACT TYPE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing contract type and requirements');

  const contractAnalysis = await ctx.task(contractTypeAnalysisTask, {
    contractType,
    partyRole,
    jurisdiction,
    industryVertical,
    outputDir
  });

  artifacts.push(...contractAnalysis.artifacts);

  ctx.log('info', `Identified ${contractAnalysis.keyTerms.length} key negotiable terms`);

  // ============================================================================
  // PHASE 2: POSITION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing negotiation positions');

  const positionDevelopment = await ctx.task(positionDevelopmentTask, {
    contractType,
    partyRole,
    keyTerms: contractAnalysis.keyTerms,
    riskTolerance,
    industryVertical,
    dealValue,
    outputDir
  });

  artifacts.push(...positionDevelopment.artifacts);
  positions = positionDevelopment.positions;

  ctx.log('info', `Developed ${positions.length} negotiation positions`);

  // ============================================================================
  // PHASE 3: FALLBACK POSITIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining fallback positions');

  const fallbackPositions = await ctx.task(fallbackPositionsTask, {
    positions,
    riskTolerance,
    strategicImportance,
    outputDir
  });

  artifacts.push(...fallbackPositions.artifacts);

  ctx.log('info', `Defined ${fallbackPositions.fallbacks.length} fallback positions`);

  // ============================================================================
  // PHASE 4: ESCALATION MATRIX
  // ============================================================================

  if (includeEscalationPaths) {
    ctx.log('info', 'Phase 4: Building escalation matrix');

    const escalationDevelopment = await ctx.task(escalationMatrixTask, {
      positions,
      fallbacks: fallbackPositions.fallbacks,
      dealValue,
      strategicImportance,
      outputDir
    });

    artifacts.push(...escalationDevelopment.artifacts);
    escalationMatrix = escalationDevelopment.matrix;

    ctx.log('info', `Created escalation matrix with ${escalationDevelopment.escalationLevels} levels`);
  }

  // ============================================================================
  // PHASE 5: TEMPLATE LANGUAGE
  // ============================================================================

  let templateLanguage = null;

  if (includeTemplateLanguage) {
    ctx.log('info', 'Phase 5: Developing template language');

    templateLanguage = await ctx.task(templateLanguageTask, {
      positions,
      fallbacks: fallbackPositions.fallbacks,
      contractType,
      jurisdiction,
      outputDir
    });

    artifacts.push(...templateLanguage.artifacts);

    ctx.log('info', `Created ${templateLanguage.clauseCount} template clauses`);
  }

  // ============================================================================
  // PHASE 6: PLAYBOOK ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 6: Assembling playbook');

  const playbookAssembly = await ctx.task(playbookAssemblyTask, {
    contractType,
    partyRole,
    jurisdiction,
    riskTolerance,
    contractAnalysis,
    positions,
    fallbacks: fallbackPositions.fallbacks,
    escalationMatrix,
    templateLanguage,
    outputDir
  });

  artifacts.push(...playbookAssembly.artifacts);
  playbook = playbookAssembly.playbook;

  // ============================================================================
  // PHASE 7: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating playbook');

  const validation = await ctx.task(playbookValidationTask, {
    playbook,
    positions,
    fallbacks: fallbackPositions.fallbacks,
    escalationMatrix,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Breakpoint: Review and Approval
  await ctx.breakpoint({
    question: `Playbook for ${contractType} complete. ${positions.length} positions, ${fallbackPositions.fallbacks.length} fallbacks. Validation score: ${validation.score}/100. Approve playbook?`,
    title: 'Playbook Review',
    context: {
      runId: ctx.runId,
      summary: {
        contractType,
        partyRole,
        positionsCount: positions.length,
        fallbacksCount: fallbackPositions.fallbacks.length,
        hasEscalationMatrix: !!escalationMatrix.levels,
        validationScore: validation.score
      },
      files: [
        { path: playbookAssembly.playbookPath, format: 'markdown', label: 'Playbook Document' },
        { path: playbookAssembly.summaryPath, format: 'json', label: 'Playbook Summary' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contractType,
    partyRole,
    playbook: {
      path: playbookAssembly.playbookPath,
      version: playbookAssembly.version,
      validationScore: validation.score
    },
    positions: positions.map(p => ({
      term: p.term,
      preferredPosition: p.preferred,
      acceptableRange: p.acceptableRange,
      dealBreaker: p.dealBreaker
    })),
    fallbacks: fallbackPositions.fallbacks.map(f => ({
      term: f.term,
      level: f.level,
      position: f.position,
      condition: f.condition
    })),
    escalationMatrix,
    templateLanguage: templateLanguage ? {
      clauseCount: templateLanguage.clauseCount,
      path: templateLanguage.languagePath
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-negotiation-playbook',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contractTypeAnalysisTask = defineTask('contract-type-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze contract type',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Analysis Specialist',
      task: 'Analyze contract type to identify key negotiable terms and typical issues',
      context: args,
      instructions: [
        'Identify all key negotiable terms for contract type',
        'Document typical negotiation points',
        'Identify jurisdiction-specific considerations',
        'Note industry-specific requirements',
        'List common areas of contention',
        'Document regulatory requirements',
        'Identify mandatory vs optional terms'
      ],
      outputFormat: 'JSON with keyTerms array, typicalIssues, jurisdictionConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyTerms', 'artifacts'],
      properties: {
        keyTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              category: { type: 'string' },
              importance: { type: 'string' },
              typicallyNegotiated: { type: 'boolean' }
            }
          }
        },
        typicalIssues: { type: 'array', items: { type: 'string' } },
        jurisdictionConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'playbook', 'analysis']
}));

export const positionDevelopmentTask = defineTask('position-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop negotiation positions',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Negotiation Position Specialist',
      task: 'Develop preferred, acceptable, and deal-breaker positions for each term',
      context: args,
      instructions: [
        'Define preferred position for each key term',
        'Define acceptable range for each term',
        'Identify deal-breaker thresholds',
        'Consider risk tolerance in position setting',
        'Factor in deal value and strategic importance',
        'Document rationale for each position',
        'Align positions with industry standards',
        'Consider counterparty perspective'
      ],
      outputFormat: 'JSON with positions array containing term, preferred, acceptableRange, dealBreaker, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['positions', 'artifacts'],
      properties: {
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              category: { type: 'string' },
              preferred: { type: 'string' },
              acceptableRange: { type: 'string' },
              dealBreaker: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['agent', 'playbook', 'positions']
}));

export const fallbackPositionsTask = defineTask('fallback-positions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define fallback positions',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Negotiation Strategy Specialist',
      task: 'Define tiered fallback positions for negotiation',
      context: args,
      instructions: [
        'Define Level 1 fallback (minor concession)',
        'Define Level 2 fallback (moderate concession)',
        'Define Level 3 fallback (significant concession)',
        'Define conditions for each fallback level',
        'Identify trade-offs between terms',
        'Document approval requirements for each level',
        'Create decision tree for fallback selection',
        'Define escalation triggers'
      ],
      outputFormat: 'JSON with fallbacks array containing term, level, position, condition, approvalRequired'
    },
    outputSchema: {
      type: 'object',
      required: ['fallbacks', 'artifacts'],
      properties: {
        fallbacks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              level: { type: 'number' },
              position: { type: 'string' },
              condition: { type: 'string' },
              approvalRequired: { type: 'string' },
              tradeOff: { type: 'string' }
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
  labels: ['agent', 'playbook', 'fallbacks']
}));

export const escalationMatrixTask = defineTask('escalation-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build escalation matrix',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Escalation Process Specialist',
      task: 'Build escalation matrix with authority levels and approval thresholds',
      context: args,
      instructions: [
        'Define escalation levels',
        'Map positions to authority levels',
        'Define approval thresholds by term type',
        'Consider deal value in authority matrix',
        'Define time limits for escalation',
        'Identify decision-makers at each level',
        'Document escalation procedures',
        'Create authority matrix document'
      ],
      outputFormat: 'JSON with matrix object, escalationLevels count, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'escalationLevels', 'artifacts'],
      properties: {
        matrix: {
          type: 'object',
          properties: {
            levels: { type: 'array', items: { type: 'object' } },
            authorityMap: { type: 'object' },
            thresholds: { type: 'object' }
          }
        },
        escalationLevels: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'playbook', 'escalation']
}));

export const templateLanguageTask = defineTask('template-language', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop template language',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Drafting Specialist',
      task: 'Develop template clause language for each position level',
      context: args,
      instructions: [
        'Draft preferred position language for each term',
        'Draft fallback position language',
        'Include alternative formulations',
        'Ensure jurisdiction compliance',
        'Use clear, unambiguous language',
        'Include explanatory comments',
        'Version control clause language',
        'Organize by term category'
      ],
      outputFormat: 'JSON with clauseCount, languagePath, clauses array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clauseCount', 'languagePath', 'artifacts'],
      properties: {
        clauseCount: { type: 'number' },
        languagePath: { type: 'string' },
        clauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              level: { type: 'string' },
              language: { type: 'string' },
              notes: { type: 'string' }
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
  labels: ['agent', 'playbook', 'language']
}));

export const playbookAssemblyTask = defineTask('playbook-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble playbook',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Playbook Assembly Specialist',
      task: 'Assemble comprehensive negotiation playbook document',
      context: args,
      instructions: [
        'Create playbook cover and introduction',
        'Document scope and applicability',
        'Organize positions by category',
        'Include fallback decision trees',
        'Add escalation matrix',
        'Include template language reference',
        'Add quick reference guide',
        'Include training notes',
        'Format as professional document'
      ],
      outputFormat: 'JSON with playbook object, playbookPath, summaryPath, version, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbook', 'playbookPath', 'artifacts'],
      properties: {
        playbook: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            version: { type: 'string' },
            scope: { type: 'string' },
            sections: { type: 'array', items: { type: 'string' } }
          }
        },
        playbookPath: { type: 'string' },
        summaryPath: { type: 'string' },
        version: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'playbook', 'assembly']
}));

export const playbookValidationTask = defineTask('playbook-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate playbook',
  agent: {
    name: 'legal-qa-specialist',
    prompt: {
      role: 'Playbook Validation Specialist',
      task: 'Validate playbook completeness and consistency',
      context: args,
      instructions: [
        'Verify all key terms have positions',
        'Check fallback consistency',
        'Validate escalation matrix completeness',
        'Verify authority levels are appropriate',
        'Check template language accuracy',
        'Validate cross-references',
        'Assess overall usability',
        'Calculate validation score'
      ],
      outputFormat: 'JSON with score, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        completeness: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'playbook', 'validation']
}));
