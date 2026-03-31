/**
 * @process standards-gap-audit
 * @description Generic gap audit process for standards research documents.
 *   Systematically audits research/comparison documentation against source extraction text
 *   using configurable failure pattern categories. Designed for any standards comparison
 *   where OCR/PDF extraction may be incomplete.
 * @inputs {
 *   documents: Array<{ name: string, path: string, description?: string }>,
 *   extractionFile: string,
 *   extractionDir?: string,
 *   gapPatterns?: Array<{ id: string, description: string }>,
 *   fixInstructions?: Record<string, string>,
 *   domainContext?: string
 * }
 * @outputs { success: boolean, gaps: Gap[], fixes: Fix[], summary: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// DEFAULT GAP PATTERNS — used when none are provided in inputs
// ============================================================================

const DEFAULT_GAP_PATTERNS = [
  { id: 'extraction_gap', description: 'Section referenced in document but content not found in extraction text' },
  { id: 'analysis_gap', description: 'Content exists in extraction but was misinterpreted or oversimplified in document' },
  { id: 'cross_reference_gap', description: 'Formula references another section that was not read before concluding' },
  { id: 'verdict_gap', description: 'A section declared IDENTICAL/UNCHANGED without verifying all application contexts' },
  { id: 'assumption_gap', description: 'A claim attributed to the new standard but actually inferred from old code or external standard' },
  { id: 'numerical_gap', description: 'Numerical coefficient or formula stated without extraction source confirmation' }
];

const DEFAULT_FIX_INSTRUCTIONS = {
  extraction_gap: 'Add blockquote: > **[UNRESOLVED — <description>. Verify from physical standard.]**',
  analysis_gap: 'Correct the text to match actual extraction content. Search extraction first.',
  cross_reference_gap: 'Add note about the unresolved cross-reference with specific section numbers.',
  verdict_gap: 'Change the verdict and add a note explaining the caveat.',
  assumption_gap: 'Add blockquote: > **[NEEDS_VERIFICATION — this claim inferred from external source, not verified in extraction text]**',
  numerical_gap: 'Flag the coefficient with: > **[NEEDS_VERIFICATION — coefficient not confirmed in extraction text]**'
};

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Audit a single document against extraction text.
 * Parameterized — works with any document and extraction source.
 */
export const auditDocument = defineTask('audit-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit ${args.docName} for extraction gaps and unverified claims`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Standards verification auditor',
      task: `Systematically audit the document "${args.docName}" against the extraction text. For EVERY claim, formula, verdict, and cross-reference, verify it is backed by extracted text. Identify gaps using the provided failure pattern categories.`,
      context: {
        docPath: args.docPath,
        extractionFile: args.extractionFile,
        extractionDir: args.extractionDir || '',
        domainContext: args.domainContext || '',
        gapPatterns: args.gapPatterns.map(p => `${p.id}: ${p.description}`)
      },
      instructions: [
        `Read the FULL document at ${args.docPath}`,
        `Read the FULL extraction text at ${args.extractionFile} (use offset/limit to cover all content)`,
        'For EACH section in the document:',
        '  a) List every section number, table, formula, annex, or coefficient referenced',
        '  b) Search the extraction text for that content',
        '  c) If content is MISSING from extraction, record the appropriate gap type',
        '  d) If content EXISTS but the document description differs, record as analysis_gap',
        '  e) If a verdict says IDENTICAL/UNCHANGED, verify by comparing actual extracted content',
        '  f) If a numerical value has no extraction source, record as numerical_gap',
        'Classify each gap severity as: high (formula/verdict wrong), medium (incomplete/unverified), low (cosmetic/minor)',
        'Return structured JSON with all gaps found'
      ],
      outputFormat: 'JSON with gaps (array of {section: string, category: string, description: string, extractionEvidence: string, severity: "high"|"medium"|"low"}), sectionsAudited (number), sectionsWithGaps (number), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'sectionsAudited', 'summary'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              extractionEvidence: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        sectionsAudited: { type: 'number' },
        sectionsWithGaps: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

/**
 * Present audit findings for review (breakpoint).
 */
export const reviewAuditFindings = defineTask('review-audit-findings', (args, _taskCtx) => ({
  kind: 'breakpoint',
  title: 'Review gap audit findings',
  breakpoint: {
    question: args.reviewMessage,
    context: {
      auditResults: args.auditResults,
      severityCounts: args.severityCounts
    },
    schema: {
      type: 'object',
      required: ['approved'],
      properties: {
        approved: { type: 'boolean' },
        response: { type: 'string' },
        feedback: { type: 'string' }
      }
    }
  }
}));

/**
 * Fix gaps in a single document.
 * Parameterized — works with any document.
 */
export const fixDocumentGaps = defineTask('fix-document-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix verified gaps in ${args.docName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Standards analyst and technical writer',
      task: `Fix the verified gaps in "${args.docName}". Apply the appropriate marker or correction for each gap type.`,
      context: {
        docPath: args.docPath,
        gaps: args.gaps,
        extractionFile: args.extractionFile,
        extractionDir: args.extractionDir || '',
        fixInstructions: args.fixInstructions
      },
      instructions: [
        `Read the document at ${args.docPath}`,
        'For each gap provided in the gaps list, apply the fix instruction matching its category:',
        ...Object.entries(args.fixInstructions).map(([cat, instr]) => `  - ${cat}: ${instr}`),
        'Preserve all existing correct content. Only modify text where gaps were identified.',
        'Use the Edit tool for each change.',
        'Return summary of all changes made'
      ],
      outputFormat: 'JSON with success (boolean), changesCount (number), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'changesCount', 'summary'],
      properties: {
        success: { type: 'boolean' },
        changesCount: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

/**
 * Final review breakpoint.
 */
export const finalReview = defineTask('final-review', (args, _taskCtx) => ({
  kind: 'breakpoint',
  title: 'Final review of gap audit fixes',
  breakpoint: {
    question: args.reviewMessage,
    context: {
      fixResults: args.fixResults
    },
    schema: {
      type: 'object',
      required: ['approved'],
      properties: {
        approved: { type: 'boolean' },
        response: { type: 'string' }
      }
    }
  }
}));

/**
 * Contribution prompt breakpoint.
 */
export const contributionPrompt = defineTask('contribution-prompt', (args, _taskCtx) => ({
  kind: 'breakpoint',
  title: 'Contribute audit insights upstream',
  breakpoint: {
    question: `Gap audit complete! Found ${args.totalGaps} gaps across ${args.docCount} document(s).\n\nKey insight: "${args.keyInsight}"\n\nWould you like to contribute this back?\n\n1. Report as feature request\n2. Submit as process improvement\n3. Skip`,
    context: {
      contribCommands: {
        featureRequest: '/babysitter:contrib feature request: Add extraction completeness verification step to research processes',
        processImprovement: '/babysitter:contrib library contribution: standards-gap-audit process'
      }
    },
    schema: {
      type: 'object',
      required: ['approved'],
      properties: {
        approved: { type: 'boolean' },
        response: { type: 'string' }
      }
    }
  }
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  const {
    documents = [],
    extractionFile = '',
    extractionDir = '',
    gapPatterns = DEFAULT_GAP_PATTERNS,
    fixInstructions = DEFAULT_FIX_INSTRUCTIONS,
    domainContext = ''
  } = inputs;

  if (!documents.length || !extractionFile) {
    return {
      success: false,
      gaps: [],
      fixes: [],
      summary: 'Missing required inputs: documents (array) and extractionFile (string) are required.'
    };
  }

  ctx.log('info', `Starting standards gap audit across ${documents.length} document(s)`);

  // ============================================================================
  // PHASE 1: PARALLEL AUDIT OF ALL DOCUMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Parallel audit of all documents against extraction text');

  const auditResults = await ctx.parallel.all(
    documents.map(doc => () => ctx.task(auditDocument, {
      docName: doc.name,
      docPath: doc.path,
      extractionFile,
      extractionDir,
      domainContext,
      gapPatterns
    }))
  );

  // Aggregate results
  const allGaps = auditResults.flatMap((result, i) =>
    (result.gaps || []).map(gap => ({ ...gap, document: documents[i].name }))
  );
  const totalGaps = allGaps.length;
  const severityCounts = {
    high: allGaps.filter(g => g.severity === 'high').length,
    medium: allGaps.filter(g => g.severity === 'medium').length,
    low: allGaps.filter(g => g.severity === 'low').length
  };

  // Build review message
  const docSummaries = auditResults.map((result, i) =>
    `${documents[i].name}: ${result.gaps?.length || 0} gaps in ${result.sectionsWithGaps || 0}/${result.sectionsAudited || 0} sections\n${result.summary || ''}`
  ).join('\n\n');

  const reviewMessage = `Gap audit complete.\n\n${docSummaries}\n\nTotal: ${totalGaps} gaps (${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low).\n\nHow would you like to proceed?`;

  // ============================================================================
  // PHASE 2: REVIEW BREAKPOINT
  // ============================================================================

  const reviewResult = await ctx.task(reviewAuditFindings, {
    reviewMessage,
    auditResults: auditResults.map((r, i) => ({ document: documents[i].name, ...r })),
    severityCounts
  });

  if (!reviewResult.approved) {
    return {
      success: false,
      gaps: allGaps,
      fixes: [],
      summary: `Audit found ${totalGaps} gaps but user chose not to fix. Feedback: ${reviewResult.feedback || reviewResult.response || ''}`
    };
  }
  // ============================================================================
  // PHASE 3: FIX GAPS IN PARALLEL
  // ============================================================================

  ctx.log('info', 'Phase 3: Fixing gaps in all documents');

  const fixResults = await ctx.parallel.all(
    documents.map((doc, i) => () => ctx.task(fixDocumentGaps, {
      docName: doc.name,
      docPath: doc.path,
      gaps: auditResults[i].gaps || [],
      extractionFile,
      extractionDir,
      fixInstructions
    }))
  );

  // ============================================================================
  // PHASE 4: FINAL REVIEW
  // ============================================================================

  const totalFixed = fixResults.reduce((sum, r) => sum + (r.changesCount || 0), 0);

  const fixSummaries = fixResults.map((result, i) =>
    `${documents[i].name}: ${result.changesCount || 0} changes`
  ).join('\n');

  const finalReviewMessage = `Gap fixes applied.\n\n${fixSummaries}\n\nTotal gaps addressed: ${totalFixed}\n\nApprove?`;

  await ctx.task(finalReview, {
    reviewMessage: finalReviewMessage,
    fixResults: fixResults.map((r, i) => ({ document: documents[i].name, ...r }))
  });

  // ============================================================================
  // PHASE 5: CONTRIBUTION PROMPT
  // ============================================================================

  const keyInsight = `Systematic gap audit found ${totalGaps} gaps across ${documents.length} document(s) using ${gapPatterns.length} failure pattern categories. Automated pattern matching catches issues that manual review misses.`;

  await ctx.task(contributionPrompt, {
    totalGaps,
    docCount: documents.length,
    keyInsight
  });

  return {
    success: true,
    gaps: allGaps,
    fixes: fixResults,
    summary: `Gap audit complete. Found ${totalGaps} gaps across ${documents.length} docs, fixed ${totalFixed}. ${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low severity.`
  };
}
